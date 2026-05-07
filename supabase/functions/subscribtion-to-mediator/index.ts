/**
 * supabase/functions/subscribe-to-mediator/index.ts
 *
 * إصلاح إعادة الاشتراك:
 * - mediator_clients: UPSERT بدل INSERT (يحل مشكلة الـ conflict عند إعادة الاشتراك)
 * - mediator_wallets: INCREMENT بدل SET (يحل مشكلة التراكم الصحيح)
 * - point_transactions للوسيط: يُضاف user_id دائماً للتتبع
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')   return json({ error: 'Method Not Allowed' }, 405);

  /* ── parse ── */
  let mediator_id: string, coins: number;
  try { ({ mediator_id, coins } = await req.json()); }
  catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!mediator_id || !coins || coins <= 0)
    return json({ error: 'mediator_id and coins (> 0) required' }, 400);

  const URL  = Deno.env.get('SUPABASE_URL')!;
  const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SRK  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  /* ── 1. تحقق من المستخدم ── */
  const userClient = createClient(URL, ANON, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const admin = createClient(URL, SRK, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  /* ── 2. تحقق أن المستقبِل وسيط ── */
  const { data: mediatorProfile } = await admin
    .from('profiles').select('role, full_name').eq('id', mediator_id).single();
  if (mediatorProfile?.role !== 'mediator')
    return json({ error: 'Target is not a mediator' }, 400);

  /* ── 3. منع الاشتراك المكرر النشط فقط ── */
  const { data: existing } = await admin
    .from('mediator_clients').select('id')
    .eq('user_id', user.id).eq('mediator_id', mediator_id)
    .eq('status', 'active').gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (existing) return json({ error: 'Already subscribed to this mediator' }, 409);

  /* ── 4. رصيد المستخدم ── */
  const { data: userWallet } = await admin
    .from('wallets').select('balance').eq('id', user.id).single();
  if (!userWallet)               return json({ error: 'User wallet not found' }, 404);
  if (userWallet.balance < coins) return json({ error: 'Insufficient balance' }, 400);

  /* ── 5. محفظة الوسيط ── */
  const { data: mediatorWallet } = await admin
    .from('mediator_wallets').select('total_coins, total_tnd, pending_tnd')
    .eq('mediator_id', mediator_id).single();
  if (!mediatorWallet) return json({ error: 'Mediator wallet not found' }, 404);

  /* ── 6. FIFO — حساب القيمة الحقيقية ── */
  const { data: payments } = await admin
    .from('konnect_payments').select('payment_id, coins_amount, tnd_amount')
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
    const available = p.coins_amount - (usageMap.get(p.payment_id) ?? 0);
    if (available <= 0) continue;
    const take = Math.min(available, remaining);
    totalTnd  += take * (Number(p.tnd_amount) / p.coins_amount);
    usageInserts.push({ payment_id: p.payment_id, user_id: user.id, used_coins: take });
    remaining -= take;
  }
  if (remaining > 0) return json({ error: 'Insufficient purchase history (FIFO exhausted)' }, 400);

  /* ── 7. عمولة الوسيط من economy_config ── */
  const { data: cfg } = await admin
    .from('economy_config').select('value').eq('key', 'mediator_commission_rate').maybeSingle();
  const rate: number = typeof cfg?.value === 'number'
    ? cfg.value : (cfg?.value?.rate ?? 0.7);
  const mediatorShare = totalTnd * rate;

  /* ── 8. القيم الجديدة ── */
  const newUserBalance        = userWallet.balance - coins;
  const newMediatorCoins      = (mediatorWallet.total_coins ?? 0) + coins;
  const newMediatorTotalTnd   = (mediatorWallet.total_tnd   ?? 0) + mediatorShare;
  const newMediatorPendingTnd = (mediatorWallet.pending_tnd ?? 0) + mediatorShare;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);
  const now = new Date().toISOString();

  /* ── بيانات المستخدم للتسجيل ── */
  const { data: userProfile } = await admin
    .from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
  const userName   = userProfile?.full_name  ?? 'مستخدم';
  const userAvatar = userProfile?.avatar_url ?? null;

  /* ── 9. تنفيذ كل العمليات ── */
  const results = await Promise.all([

    /* A. خصم رصيد المستخدم */
    admin.from('wallets')
      .update({ balance: newUserBalance, updated_at: now })
      .eq('id', user.id),

    /* B. تحديث محفظة الوسيط */
    admin.from('mediator_wallets')
      .update({
        total_coins: newMediatorCoins,
        total_tnd:   newMediatorTotalTnd,
        pending_tnd: newMediatorPendingTnd,
        updated_at:  now,
      })
      .eq('mediator_id', mediator_id),

    /*
     * C. UPSERT في mediator_clients ← الإصلاح الرئيسي
     *    بدل INSERT الذي يفشل إذا كان هناك row cancelled بنفس (user_id, mediator_id)
     *    يُحدّث الصف القديم بالبيانات الجديدة ويُعيده إلى active
     */
    admin.from('mediator_clients')
      .upsert({
        user_id:     user.id,
        mediator_id,
        coins,
        tnd_value:   totalTnd,
        status:      'active',
        expires_at:  expires.toISOString(),
        created_at:  now,          // يُحدَّث عند إعادة الاشتراك
      }, {
        onConflict:        'user_id,mediator_id',   // ← يجب وجود unique constraint
        ignoreDuplicates:  false,
      }),

    /* D. معاملة المستخدم */
    admin.from('point_transactions').insert({
      user_id:       user.id,
      mediator_id,
      amount:        -coins,
      balance_after: newUserBalance,
      action:        'subscription',
      source:        'subscription',
      user_name:     userName,
      user_avatar:   userAvatar,
      notes:         `اشتراك مع الوسيط (${coins} عملة)`,
    }),

    /* E. معاملة الوسيط */
    admin.from('point_transactions').insert({
      user_id:       user.id,        // ← لتتبع من أتى الاشتراك
      mediator_id,
      amount:        coins,
      balance_after: newMediatorCoins,
      action:        'deposit',
      source:        'mediator_income',
      user_name:     userName,
      user_avatar:   userAvatar,
      value_tnd:     mediatorShare,
      notes:         `اشتراك عميل: ${userName} (${coins} عملة)`,
    }),

    /* F. تسجيل استخدامات FIFO */
    admin.from('payment_usages').insert(usageInserts),

    /* G. تحديث profiles.mediator_id للمستخدم */
    admin.from('profiles')
      .update({ mediator_id })
      .eq('id', user.id),
  ]);

  const errors = results.map(r => r.error).filter(Boolean);
  if (errors.length > 0) {
    console.error('[subscribe-to-mediator] errors:', JSON.stringify(errors));
    return json({
      error:   'Partial failure — check server logs',
      details: errors.map((e: any) => e.message),
    }, 500);
  }

  return json({
    success:         true,
    coins,
    tnd_value:       totalTnd,
    mediator_share:  mediatorShare,
    commission_rate: rate,
    expires_at:      expires.toISOString(),
  });
});