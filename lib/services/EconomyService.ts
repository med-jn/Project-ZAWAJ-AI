/**
 * ⚙️ محرك الاقتصاد الكامل — ZAWAJ AI
 * ✅ مُصحَّح: BUG-01 / BUG-02 / BUG-03 / BUG-04
 */
import { supabase } from '@/lib/supabase/client';
import { ECONOMY_SETTINGS } from '@/constants/constants';

const { DATABASE, GENERAL_INTERFACE, MEDIATOR_SPACE, REWARDS, ALERTS, UI_LOGIC } = ECONOMY_SETTINGS;

// ══════════════════════════════════════════
//  نوع المحفظة — مطابق لجدول wallets في Supabase
// ══════════════════════════════════════════
interface WalletRow {
  id:                string;   // = user_id
  balance:           number;   // النقاط المشتراة  (paid)
  balance_free:      number;   // النقاط المجانية  (bonus)
  last_daily_login: string | null; // آخر مكافأة يومية (date)
  last_active_at:  string | null;
}

// ══════════════════════════════════════════
//  جلب المحفظة
//  ✅ إصلاح BUG-03: البحث بـ id وليس user_id
// ══════════════════════════════════════════
export async function getWallet(userId: string): Promise<WalletRow> {
  const { data, error } = await supabase
    .from(DATABASE.TABLE_WALLETS)
    .select('id, balance, balance_free, last_daily_login, last_active_at')
    .eq(DATABASE.WALLET_KEY, userId)   // ✅ 'id' = userId
    .single();

  if (error) throw new Error(`تعذّر جلب المحفظة: ${error.message}`);
  return data;
}

// ══════════════════════════════════════════
//  التحقق من كفاية الرصيد
//  ✅ إصلاح BUG-01: استخدام balance / balance_free
// ══════════════════════════════════════════
export function hasEnoughBalance(
  wallet: WalletRow,
  cost: number,
  paidOnly = false
): boolean {
  if (paidOnly) return wallet.balance >= cost;
  return wallet.balance + wallet.balance_free >= cost;
}

// ══════════════════════════════════════════
//  تسجيل معاملة في point_transactions
//  ✅ إصلاح BUG-04: استخدام id (user_id) لا wallet_id
// ══════════════════════════════════════════
async function logTransaction(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from(DATABASE.TABLE_TRANSACTIONS)
    .insert({
      [DATABASE.TRANSACTION_USER_KEY]: userId,  // ✅ 'id' = userId
      amount,
      reason,
    });

  // نسجّل الخطأ لكن لا نوقف العملية الأصلية
  if (error) console.error('فشل تسجيل المعاملة:', error.message);
}

// ══════════════════════════════════════════
//  خصم نقاط (paid أولاً ثم bonus)
// ══════════════════════════════════════════
export async function deductPoints(
  userId: string,
  cost: number,
  reason: string,
  paidOnly = false
): Promise<{ success: boolean; message: string }> {

  const wallet = await getWallet(userId);

  if (!hasEnoughBalance(wallet, cost, paidOnly)) {
    return {
      success: false,
      message: paidOnly ? ALERTS.PAID_ONLY : ALERTS.LOW_BALANCE,
    };
  }

  // احسب كم يُخصم من كل رصيد
  let paidDeduct  = 0;
  let bonusDeduct = 0;

  if (paidOnly) {
    paidDeduct = cost;
  } else {
    paidDeduct  = Math.min(wallet.balance, cost);
    bonusDeduct = cost - paidDeduct;
  }

  // ✅ إصلاح BUG-01: COLUMN_PAID='balance' / COLUMN_BONUS='balance_free'
  const { error } = await supabase
    .from(DATABASE.TABLE_WALLETS)
    .update({
      [DATABASE.COLUMN_PAID]:  wallet.balance      - paidDeduct,
      [DATABASE.COLUMN_BONUS]: wallet.balance_free - bonusDeduct,
    })
    .eq(DATABASE.WALLET_KEY, userId);

  if (error) throw new Error(`فشل تحديث المحفظة: ${error.message}`);

  // تسجيل المعاملة
  await logTransaction(userId, -cost, 'subtract', reason);

  return { success: true, message: 'تم الخصم بنجاح' };
}

// ══════════════════════════════════════════
//  إضافة نقاط مكافأة (bonus فقط)
// ══════════════════════════════════════════
export async function addBonusPoints(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {

  const wallet = await getWallet(userId);

  const { error } = await supabase
    .from(DATABASE.TABLE_WALLETS)
    .update({
      [DATABASE.COLUMN_BONUS]: wallet.balance_free + amount,
    })
    .eq(DATABASE.WALLET_KEY, userId);

  if (error) throw new Error(`فشل إضافة النقاط: ${error.message}`);

  await logTransaction(userId, amount, 'add', reason);
}

// ══════════════════════════════════════════
//  عمليات الواجهة الرئيسية
// ══════════════════════════════════════════

export const swipeRight = (userId: string) =>
  deductPoints(userId, GENERAL_INTERFACE.SWIPE_RIGHT_COST, 'تصفح بطاقة');

export const sendLike = (userId: string) =>
  deductPoints(userId, GENERAL_INTERFACE.LIKE_COST, 'إعجاب');

export const sendMessage = (userId: string) =>
  deductPoints(userId, GENERAL_INTERFACE.MESSAGE_COST, 'فتح محادثة');

// ══════════════════════════════════════════
//  خدمات الوسيط (paid فقط)
// ══════════════════════════════════════════

export const requestUrgentConsultation = (userId: string) =>
  deductPoints(userId, MEDIATOR_SPACE.SINGLE_SERVICES.URGENT_CONSULTATION, 'استشارة عاجلة', true);

export const sendGiftToMediator = (userId: string) =>
  deductPoints(userId, MEDIATOR_SPACE.SINGLE_SERVICES.GIFT_TO_MEDIATOR, 'هدية للوسيط', true);

// ══════════════════════════════════════════
//  مكافأة التسجيل اليومي
//  ✅ إصلاح BUG-02: COLUMN_DAILY_CLAIM='last_daily_login'
// ══════════════════════════════════════════
export async function claimDailyBonus(
  userId: string
): Promise<{ success: boolean; message: string }> {

  const wallet = await getWallet(userId);

  // وقت إعادة الضبط اليومي (5 AM UTC)
  const todayReset = new Date();
  todayReset.setUTCHours(UI_LOGIC.RESET_HOUR_UTC, 0, 0, 0);

  // ✅ last_daily_login نوعه date في Supabase، نقرأه كـ string ثم نحوّله
  const lastClaim = wallet.last_daily_login
    ? new Date(wallet.last_daily_login)
    : null;

  if (lastClaim && lastClaim >= todayReset) {
    return { success: false, message: 'استلمت مكافأتك اليوم بالفعل! 🎁' };
  }

  await addBonusPoints(userId, REWARDS.DAILY_LOGIN_BONUS, 'مكافأة تسجيل يومية');

  // ✅ تحديث العمود الصحيح
  await supabase
    .from(DATABASE.TABLE_WALLETS)
    .update({ [DATABASE.COLUMN_DAILY_CLAIM]: new Date().toISOString().split('T')[0] })
    .eq(DATABASE.WALLET_KEY, userId);

  return {
    success: true,
    message: `تم إضافة ${REWARDS.DAILY_LOGIN_BONUS} نقطة مكافأة! 🎉`,
  };
}

// ══════════════════════════════════════════
//  مكافأة الترحيب (عند التسجيل لأول مرة)
// ══════════════════════════════════════════
export async function giveWelcomeBonus(userId: string): Promise<void> {
  await addBonusPoints(userId, REWARDS.WELCOME_BONUS, 'مكافأة الترحيب');
}