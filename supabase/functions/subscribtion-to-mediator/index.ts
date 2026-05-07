/**
 * supabase/functions/subscribe-to-mediator/index.ts
 *
 * التصميم النظيف:
 * ┌─────────────────────────────────────────────────────────┐
 * │  profiles.mediator_id  = مصدر الحقيقة الوحيد           │
 * │  mediator_clients      = سجل مالي تاريخي (INSERT دائماً)│
 * │  mediator_subscriptions= جدول قديم (UPSERT للتوافق)    │
 * └─────────────────────────────────────────────────────────┘
 *
 * عند الاشتراك:
 *   1. profiles.mediator_id = mediator_id  ← أولاً ومضمون
 *   2. wallets.balance -= coins
 *   3. mediator_wallets += coins/tnd
 *   4. mediator_clients INSERT (سجل مالي جديد)
 *   5. mediator_subscriptions UPSERT (توافق مع RPC)
 *   6. point_transactions للطرفين
 *   7. payment_usages (FIFO)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s, headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')   return json({ error: 'Method Not Allowed' }, 405);

  /* ── Parse ── */
  let mediator_id: string, coins: number;
  try { ({ mediator_id, coins } = await req.json()); }
  catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!mediator_id || !coins || coins <= 0)
    return json({ error: 'mediator_id and coins (> 0) required' }, 400);

  const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SRK      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  /* ── 1. تحقق من المستخدم ── */
  const userClient = createClient(SUPA_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const admin = createClient(SUPA_URL, SRK, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  /* ── 2. بيانات المستخدم + الفحص الوحيد للاشتراك ── */
  const { data: uProf } = await admin
    .from('profiles')
    .select('mediator_id, full_name, avatar_url, role')
    .eq('id', user.id)
    .single();

  if (!uProf) return json({ error: 'User profile not found' }, 404);

  // ← مصدر الحقيقة الوحيد: profiles.mediator_id
  if (uProf.mediator_id === mediator_id)
    return json({ error: 'Already subscribed to this mediator' }, 409);

  /* ── 3. تحقق أن الهدف وسيط ── */
  const { data: mProf } = await admin
    .from('profiles').select('role, full_name').eq('id', mediator_id).single();
  if (mProf?.role !== 'mediator')
    return json({ error: 'Target is not a mediator' }, 400);

  /* ── 4. رصيد المستخدم ── */
  const { data: uWallet } = await admin
    .from('wallets').select('balance').eq('id', user.id).single();
  if (!uWallet)              return json({ error: 'User wallet not found' }, 404);
  if (uWallet.balance < coins) return json({ error: 'Insufficient balance' }, 400);

  /* ── 5. محفظة الوسيط ── */
  const { data: mWallet } = await admin
    .from('mediator_wallets')
    .select('total_coins, total_tnd, pending_tnd')
    .eq('mediator_id', mediator_id).single();
  if (!mWallet) return json({ error: 'Mediator wallet not found' }, 404);

  /* ── 6. FIFO ── */
  const { data: payments } = await admin
    .from('konnect_payments')
    .select('payment_id, coins_amount, tnd_amount')
    .eq('user_id', user.id).eq('status', 'completed')
    .order('created_at', { ascending: true });

  const { data: usages } = await admin
    .from('payment_usages').select('payment_id, used_coins').eq('user_id', user.id);

  const usageMap = new Map<string, number>();
  for (const u of usages ?? [])
    usageMap.set(u.payment_id, (usageMap.get(u.payment_id) ?? 0) + u.used_coins);

  let remaining = coins, totalTnd = 0;
  const usageInserts: { payment_id: string; user_id: string; used_coins: number }[] = [];

  for (const p of payments ?? []) {
    if (remaining <= 0) break;
    const avail = p.coins_amount - (usageMap.get(p.payment_id) ?? 0);
    if (avail <= 0) continue;
    const take = Math.min(avail, remaining);
    totalTnd  += take * (Number(p.tnd_amount) / p.coins_amount);
    usageInserts.push({ payment_id: p.payment_id, user_id: user.id, used_coins: take });
    remaining -= take;
  }
  if (remaining > 0)
    return json({ error: `FIFO exhausted — ${remaining} coins unmatched` }, 400);

  /* ── 7. نسبة العمولة ── */
  const { data: cfg } = await admin
    .from('economy_config').select('value').eq('key', 'mediator_commission_rate').maybeSingle();
  const rate: number = typeof cfg?.value === 'number' ? cfg.value
    : (cfg?.value?.rate ?? 0.7);
  const share = totalTnd * rate;

  /* ── 8. القيم المحسوبة ── */
  const now        = new Date().toISOString();
  const expires    = new Date();
  expires.setMonth(expires.getMonth() + 1);
  const expiresISO = expires.toISOString();

  const newUserBal   = uWallet.balance - coins;
  const newMedCoins  = (mWallet.total_coins  ?? 0) + coins;
  const newMedTnd    = (mWallet.total_tnd    ?? 0) + share;
  const newMedPend   = (mWallet.pending_tnd  ?? 0) + share;
  const userName     = uProf.full_name  ?? 'مستخدم';
  const userAvatar   = uProf.avatar_url ?? null;

  /* ════════════════════════════════════════════════════════
     STEP A — profiles.mediator_id أولاً (مستقل ومضمون)
     إذا فشل هذا، لا نتابع لأي خطوة أخرى
  ════════════════════════════════════════════════════════ */
  const { error: profErr } = await admin
    .from('profiles')
    .update({ mediator_id, updated_at: now })
    .eq('id', user.id);

  if (profErr) {
    console.error('[subscribe] CRITICAL: profiles.update failed:', profErr.message);
    return json({ error: 'Failed to update user profile', detail: profErr.message }, 500);
  }

  /* ════════════════════════════════════════════════════════
     STEP B — باقي العمليات (parallel)
  ════════════════════════════════════════════════════════ */
  const [
    walletRes,
    medWalletRes,
    clientRes,
    medSubRes,
    txUserRes,
    txMedRes,
    fifoRes,
  ] = await Promise.all([

    /* B1. خصم رصيد المستخدم */
    admin.from('wallets')
      .update({ balance: newUserBal, updated_at: now })
      .eq('id', user.id),

    /* B2. تحديث محفظة الوسيط */
    admin.from('mediator_wallets')
      .update({
        total_coins: newMedCoins,
        total_tnd:   newMedTnd,
        pending_tnd: newMedPend,
        updated_at:  now,
      })
      .eq('mediator_id', mediator_id),

    /* B3. سجل مالي جديد في mediator_clients (INSERT — تاريخ كامل) */
    admin.from('mediator_clients').insert({
      user_id:    user.id,
      mediator_id,
      coins,
      tnd_value:  totalTnd,
      status:     'active',
      expires_at: expiresISO,
      created_at: now,
    }),

    /* B4. UPSERT mediator_subscriptions (الجدول القديم — توافق مع get_mediators RPC)
       PK الفعلي: med_sub_internal_id
       unique: (id=user_id, mediator_id) ← يجب وجود الـ constraint من migration 04 */
    admin.from('mediator_subscriptions')
      .upsert({
        id:          user.id,
        mediator_id,
        status:      'active',
        expires_at:  expiresISO,
        created_at:  now,
      }, { onConflict: 'id,mediator_id', ignoreDuplicates: false }),

    /* B5. معاملة المستخدم */
    admin.from('point_transactions').insert({
      user_id:       user.id,
      mediator_id,
      amount:        -coins,
      balance_after: newUserBal,
      action:        'subscription',
      source:        'subscription',
      user_name:     userName,
      user_avatar:   userAvatar,
      notes:         `اشتراك مع الوسيط — ${coins.toLocaleString('ar-TN')} عملة`,
    }),

    /* B6. معاملة الوسيط */
    admin.from('point_transactions').insert({
      user_id:       user.id,
      mediator_id,
      amount:        coins,
      balance_after: newMedCoins,
      action:        'deposit',
      source:        'mediator_income',
      user_name:     userName,
      user_avatar:   userAvatar,
      value_tnd:     share,
      notes:         `اشتراك عميل: ${userName} — ${coins.toLocaleString('ar-TN')} عملة (${share.toFixed(3)} د.ت)`,
    }),

    /* B7. FIFO */
    usageInserts.length > 0
      ? admin.from('payment_usages').insert(usageInserts)
      : Promise.resolve({ error: null }),
  ]);

  /* ── تسجيل الأخطاء دون إيقاف النجاح ──
     profiles.mediator_id تم تحديثه → الاشتراك مُسجَّل
     نُرجع نجاحاً مع تحذيرات لو في أخطاء ثانوية */
  const stepErrors = [
    walletRes, medWalletRes, clientRes, medSubRes,
    txUserRes, txMedRes, fifoRes,
  ]
    .map((r, i) => r?.error ? `B${i + 1}: ${r.error.message}` : null)
    .filter(Boolean);

  if (stepErrors.length > 0) {
    console.error('[subscribe] secondary errors (profile already updated):', stepErrors);
  }

  return json({
    success:         true,
    coins,
    tnd_value:       totalTnd,
    mediator_share:  share,
    commission_rate: rate,
    expires_at:      expiresISO,
    ...(stepErrors.length > 0 && { warnings: stepErrors }),
  });
});