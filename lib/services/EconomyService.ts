/**
 * ⚙️ محرك الاقتصاد — ZAWAJ AI  v2.0
 * ✅ إصلاح: توقيع logTransaction (كان يستقبل 3 معاملات ويُستدعى بـ 4)
 * ✅ إضافة: balance_after في كل معاملة
 * ✅ إضافة: source + action في كل معاملة
 */
import { supabase }         from '@/lib/supabase/client';
import { ECONOMY_SETTINGS } from '@/constants/constants';
import { ECONOMY_RULES, type TransactionSource } from '@/constants/ecomomy';

const { DATABASE, GENERAL_INTERFACE, MEDIATOR_SPACE, REWARDS, ALERTS, UI_LOGIC } = ECONOMY_SETTINGS;

// ══════════════════════════════════════════
//  نوع المحفظة — مطابق لجدول wallets
// ══════════════════════════════════════════
interface WalletRow {
  id:               string;
  balance:          number;   // paid
  balance_free:     number;   // bonus
  last_daily_login: string | null;
  last_active_at:   string | null;
}

// ══════════════════════════════════════════
//  جلب المحفظة
// ══════════════════════════════════════════
export async function getWallet(userId: string): Promise<WalletRow> {
  const { data, error } = await supabase
    .from(DATABASE.TABLE_WALLETS)
    .select('id, balance, balance_free, last_daily_login, last_active_at')
    .eq(DATABASE.WALLET_KEY, userId)
    .single();

  if (error) throw new Error(`تعذّر جلب المحفظة: ${error.message}`);
  return data;
}

// ══════════════════════════════════════════
//  التحقق من كفاية الرصيد
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
//  ✅ إصلاح: 5 معاملات واضحة بدلاً من 3 غامضة
// ══════════════════════════════════════════
async function logTransaction(params: {
  userId:       string;
  amount:       number;          // موجب أو سالب
  balanceAfter: number;          // إجمالي paid + free بعد العملية
  source:       TransactionSource;
  action?:      string;
  notes?:       string;
  paymentId?:   string;
}): Promise<void> {
  const { error } = await supabase
    .from(DATABASE.TABLE_TRANSACTIONS)
    .insert({
      user_id:       params.userId,
      amount:        params.amount,
      balance_after: params.balanceAfter,
      source:        params.source,
      action:        params.action   ?? null,
      notes:         params.notes    ?? null,
      payment_id:    params.paymentId ?? null,
    });

  // نسجّل الخطأ لكن لا نوقف العملية الأصلية
  if (error) console.error('[EconomyService] فشل تسجيل المعاملة:', error.message);
}

// ══════════════════════════════════════════
//  خصم نقاط (paid أولاً ثم bonus)
// ══════════════════════════════════════════
export async function deductPoints(
  userId:   string,
  cost:     number,
  action:   string,
  paidOnly  = false
): Promise<{ success: boolean; message: string }> {

  const wallet = await getWallet(userId);

  if (!hasEnoughBalance(wallet, cost, paidOnly)) {
    return {
      success: false,
      message: paidOnly ? ALERTS.PAID_ONLY : ALERTS.LOW_BALANCE,
    };
  }

  const paidDeduct  = paidOnly ? cost : Math.min(wallet.balance, cost);
  const bonusDeduct = paidOnly ? 0    : cost - paidDeduct;

  const newPaid  = wallet.balance      - paidDeduct;
  const newBonus = wallet.balance_free - bonusDeduct;

  const { error } = await supabase
    .from(DATABASE.TABLE_WALLETS)
    .update({
      [DATABASE.COLUMN_PAID]:  newPaid,
      [DATABASE.COLUMN_BONUS]: newBonus,
      updated_at: new Date().toISOString(),
    })
    .eq(DATABASE.WALLET_KEY, userId);

  if (error) throw new Error(`فشل تحديث المحفظة: ${error.message}`);

  await logTransaction({
    userId,
    amount:       -cost,
    balanceAfter: newPaid + newBonus,
    source:       ECONOMY_RULES.TRANSACTION_SOURCES.ACTION,
    action,
    notes:        paidOnly ? 'paid_only' : undefined,
  });

  return { success: true, message: 'تم الخصم بنجاح' };
}

// ══════════════════════════════════════════
//  إضافة نقاط مكافأة (bonus فقط)
// ══════════════════════════════════════════
export async function addBonusPoints(
  userId: string,
  amount: number,
  source: TransactionSource,
  notes?: string
): Promise<void> {

  const wallet = await getWallet(userId);
  const newBonus = wallet.balance_free + amount;

  const { error } = await supabase
    .from(DATABASE.TABLE_WALLETS)
    .update({
      [DATABASE.COLUMN_BONUS]: newBonus,
      updated_at: new Date().toISOString(),
    })
    .eq(DATABASE.WALLET_KEY, userId);

  if (error) throw new Error(`فشل إضافة النقاط: ${error.message}`);

  await logTransaction({
    userId,
    amount,
    balanceAfter: wallet.balance + newBonus,
    source,
    notes,
  });
}

// ══════════════════════════════════════════
//  عمليات الواجهة الرئيسية
// ══════════════════════════════════════════

export const swipeRight = (userId: string) =>
  deductPoints(userId, GENERAL_INTERFACE.SWIPE_RIGHT_COST, ECONOMY_RULES.ACTIONS.BACK);

export const sendLike = (userId: string) =>
  deductPoints(userId, GENERAL_INTERFACE.LIKE_COST, ECONOMY_RULES.ACTIONS.LIKE);

export const sendMessage = (userId: string) =>
  deductPoints(userId, GENERAL_INTERFACE.MESSAGE_COST, ECONOMY_RULES.ACTIONS.CHAT);

// ══════════════════════════════════════════
//  خدمات الوسيط (paid فقط)
// ══════════════════════════════════════════

export const requestUrgentConsultation = (userId: string) =>
  deductPoints(userId, MEDIATOR_SPACE.SINGLE_SERVICES.URGENT_CONSULTATION, ECONOMY_RULES.ACTIONS.CONSULT, true);

export const sendGiftToMediator = (userId: string) =>
  deductPoints(userId, MEDIATOR_SPACE.SINGLE_SERVICES.GIFT_TO_MEDIATOR, ECONOMY_RULES.ACTIONS.GIFT, true);

// ══════════════════════════════════════════
//  مكافأة التسجيل اليومي
// ══════════════════════════════════════════
export async function claimDailyBonus(
  userId: string
): Promise<{ success: boolean; message: string }> {

  const wallet = await getWallet(userId);

  const todayReset = new Date();
  todayReset.setUTCHours(UI_LOGIC.RESET_HOUR_UTC, 0, 0, 0);

  const lastClaim = wallet.last_daily_login
    ? new Date(wallet.last_daily_login)
    : null;

  if (lastClaim && lastClaim >= todayReset) {
    return { success: false, message: 'استلمت مكافأتك اليوم بالفعل! 🎁' };
  }

  await addBonusPoints(
    userId,
    REWARDS.DAILY_LOGIN_BONUS,
    ECONOMY_RULES.TRANSACTION_SOURCES.DAILY_BONUS,
    'مكافأة تسجيل يومية'
  );

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
//  مكافأة الترحيب
// ══════════════════════════════════════════
export async function giveWelcomeBonus(userId: string): Promise<void> {
  await addBonusPoints(
    userId,
    REWARDS.WELCOME_BONUS,
    ECONOMY_RULES.TRANSACTION_SOURCES.WELCOME,
    'مكافأة الترحيب'
  );
}