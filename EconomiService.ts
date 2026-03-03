/**
 * ⚙️ محرك الاقتصاد الكامل — ZAWAJ AI
 * يتحكم في كل عمليات الخصم والإضافة والمحفظة
 */
import { supabase } from './lib/supabase/client';
import { ECONOMY_SETTINGS } from '@/constants/constants';

const { DATABASE, GENERAL_INTERFACE, MEDIATOR_SPACE, REWARDS, ALERTS, UI_LOGIC } = ECONOMY_SETTINGS;

// ══════════════════════════════════════════
//  جلب المحفظة
// ══════════════════════════════════════════
export async function getWallet(userId: string) {
  const { data, error } = await supabase
    .from(DATABASE.TABLE_WALLETS)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error('تعذّر جلب المحفظة');
  return data;
}

// ══════════════════════════════════════════
//  التحقق من كفاية الرصيد
// ══════════════════════════════════════════
export function hasEnoughBalance(
  wallet: { paid_balance: number; bonus_balance: number },
  cost: number,
  paidOnly = false
): boolean {
  if (paidOnly) return wallet.paid_balance >= cost;
  return wallet.paid_balance + wallet.bonus_balance >= cost;
}

// ══════════════════════════════════════════
//  خصم نقاط (paid أولاً ثم bonus)
// ══════════════════════════════════════════
export async function deductPoints(
  userId: string,
  cost: number,
  description: string,
  paidOnly = false
): Promise<{ success: boolean; message: string }> {
  const wallet = await getWallet(userId);

  if (!hasEnoughBalance(wallet, cost, paidOnly)) {
    return {
      success: false,
      message: paidOnly ? ALERTS.PAID_ONLY : ALERTS.LOW_BALANCE,
    };
  }

  // حساب كم يُخصم من كل رصيد
  let paidDeduct = 0;
  let bonusDeduct = 0;

  if (paidOnly) {
    paidDeduct = cost;
  } else {
    paidDeduct = Math.min(wallet.paid_balance, cost);
    bonusDeduct = cost - paidDeduct;
  }

  // تحديث المحفظة
  const { error } = await supabase
    .from(DATABASE.TABLE_WALLETS)
    .update({
      [DATABASE.COLUMN_PAID]: wallet.paid_balance - paidDeduct,
      [DATABASE.COLUMN_BONUS]: wallet.bonus_balance - bonusDeduct,
    })
    .eq('user_id', userId);

  if (error) throw new Error('فشل تحديث المحفظة');

  // تسجيل المعاملة في السجل
  await supabase.from(DATABASE.TABLE_TRANSACTIONS).insert({
    wallet_id: wallet.id,
    amount: -cost,
    transaction_type: 'deduct',
    balance_type: paidOnly ? 'paid' : 'mixed',
    description,
  });

  return { success: true, message: 'تم الخصم بنجاح' };
}

// ══════════════════════════════════════════
//  إضافة نقاط مكافأة (bonus فقط)
// ══════════════════════════════════════════
export async function addBonusPoints(
  userId: string,
  amount: number,
  description: string
): Promise<void> {
  const wallet = await getWallet(userId);

  await supabase
    .from(DATABASE.TABLE_WALLETS)
    .update({ [DATABASE.COLUMN_BONUS]: wallet.bonus_balance + amount })
    .eq('user_id', userId);

  await supabase.from(DATABASE.TABLE_TRANSACTIONS).insert({
    wallet_id: wallet.id,
    amount,
    transaction_type: 'credit',
    balance_type: 'bonus',
    description,
  });
}

// ══════════════════════════════════════════
//  عمليات الواجهة الرئيسية
// ══════════════════════════════════════════

/** سحب لليمين — يخصم من أي رصيد */
export const swipeRight = (userId: string) =>
  deductPoints(userId, GENERAL_INTERFACE.SWIPE_RIGHT_COST, 'سحب لليمين');

/** إعجاب — يخصم من أي رصيد */
export const sendLike = (userId: string) =>
  deductPoints(userId, GENERAL_INTERFACE.LIKE_COST, 'إعجاب');

/** إرسال رسالة — يخصم من أي رصيد */
export const sendMessage = (userId: string) =>
  deductPoints(userId, GENERAL_INTERFACE.MESSAGE_COST, 'إرسال رسالة');

// ══════════════════════════════════════════
//  خدمات الوسيط (paid فقط — لا يقبل bonus)
// ══════════════════════════════════════════

/** استشارة عاجلة — paid فقط */
export const requestUrgentConsultation = (userId: string) =>
  deductPoints(
    userId,
    MEDIATOR_SPACE.SINGLE_SERVICES.URGENT_CONSULTATION,
    'استشارة عاجلة',
    true
  );

/** هدية للوسيط — paid فقط */
export const sendGiftToMediator = (userId: string) =>
  deductPoints(
    userId,
    MEDIATOR_SPACE.SINGLE_SERVICES.GIFT_TO_MEDIATOR,
    'هدية للوسيط',
    true
  );

// ══════════════════════════════════════════
//  مكافأة التسجيل اليومي
// ══════════════════════════════════════════
export async function claimDailyBonus(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const wallet = await getWallet(userId);

  // حساب وقت الإعادة اليومية (5 AM UTC)
  const todayReset = new Date();
  todayReset.setUTCHours(UI_LOGIC.RESET_HOUR_UTC, 0, 0, 0);

  const lastClaim = wallet.last_daily_claim
    ? new Date(wallet.last_daily_claim)
    : null;

  if (lastClaim && lastClaim > todayReset) {
    return { success: false, message: 'استلمت مكافأتك اليوم بالفعل! 🎁' };
  }

  await addBonusPoints(userId, REWARDS.DAILY_LOGIN_BONUS, 'مكافأة تسجيل يومية');

  await supabase
    .from(DATABASE.TABLE_WALLETS)
    .update({ last_daily_claim: new Date().toISOString() })
    .eq('user_id', userId);

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