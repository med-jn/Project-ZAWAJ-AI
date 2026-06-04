/**
 * ⚙️ محرك الاقتصاد — ZAWAJ AI
 * التطبيق مجاني بالكامل — نقاط هدايا فقط (balance_free)
 * لا شراء، لا اشتراكات، لا point_transactions
 */
import { supabase }         from '@/lib/supabase/client';
import { ECONOMY_SETTINGS } from '@/constants/constants';
import { ECONOMY_RULES, type TransactionSource } from '@/constants/ecomomy';

const { DATABASE, REWARDS, UI_LOGIC } = ECONOMY_SETTINGS;

interface WalletRow {
  id:               string;
  balance_free:     number;
  last_daily_login: string | null;
}

// ══════════════════════════════════════════
//  جلب المحفظة
// ══════════════════════════════════════════
export async function getWallet(userId: string): Promise<WalletRow> {
  const { data, error } = await supabase
    .from(DATABASE.TABLE_WALLETS)
    .select('id, balance_free, last_daily_login')
    .eq(DATABASE.WALLET_KEY, userId)
    .single();

  if (error) throw new Error(`تعذّر جلب المحفظة: ${error.message}`);
  return data;
}

// ══════════════════════════════════════════
//  تسجيل مكافأة في gift_transactions
// ══════════════════════════════════════════
async function logGift(params: {
  userId:       string;
  amount:       number;
  balanceAfter: number;
  source:       string;
  action?:      string;
  notes?:       string;
}): Promise<void> {
  const { error } = await supabase
    .from('gift_transactions')
    .insert({
      user_id:       params.userId,
      amount:        params.amount,
      balance_after: params.balanceAfter,
      source:        params.source,
      action:        params.action ?? null,
      notes:         params.notes  ?? null,
    });

  if (error) console.error('[EconomyService] فشل تسجيل المكافأة:', error.message);
}

// ══════════════════════════════════════════
//  إضافة نقاط مكافأة (balance_free فقط)
// ══════════════════════════════════════════
export async function addBonusPoints(
  userId: string,
  amount: number,
  source: TransactionSource,
  notes?: string
): Promise<void> {
  const wallet   = await getWallet(userId);
  const newBonus = wallet.balance_free + amount;

  const { error } = await supabase
    .from(DATABASE.TABLE_WALLETS)
    .update({
      [DATABASE.COLUMN_BONUS]: newBonus,
      updated_at: new Date().toISOString(),
    })
    .eq(DATABASE.WALLET_KEY, userId);

  if (error) throw new Error(`فشل إضافة النقاط: ${error.message}`);

  await logGift({
    userId,
    amount,
    balanceAfter: newBonus,
    source:       String(source),
    action:       String(source),
    notes,
  });
}

// ══════════════════════════════════════════
//  مكافأة التسجيل اليومي
// ══════════════════════════════════════════
export async function claimDailyBonus(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const wallet = await getWallet(userId);

  const todayReset = new Date();
  todayReset.setUTCHours(UI_LOGIC.RESET_HOUR_UTC, 0, 0, 0);

  const lastClaim = wallet.last_daily_login ? new Date(wallet.last_daily_login) : null;
  if (lastClaim && lastClaim >= todayReset) {
    return { success: false, message: 'استلمت مكافأتك اليوم بالفعل!' };
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
    message: `تم إضافة ${REWARDS.DAILY_LOGIN_BONUS} نقطة مكافأة!`,
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
