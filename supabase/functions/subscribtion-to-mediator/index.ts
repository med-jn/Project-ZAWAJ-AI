/**
 * supabase/functions/subscribe-to-mediator/index.ts
 *
 * ✅ يدعم اشتراك متعدد مع وسطاء مختلفين
 * ✅ INSERT في mediator_clients (لا UPSERT) → يزيد العداد التاريخي
 * ✅ UPSERT في mediator_subscriptions → مصدر حالة النشاط
 * ✅ total_subscription_events يزيد بـ 1 عند كل اشتراك ناجح
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

  let mediator_id: string, coins: number;
  try { ({ mediator_id, coins } = await req.json()); }
  catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!mediator_id || !coins || coins <= 0)
    return json({ error: 'mediator_id and coins required' }, 400);

  const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SRK      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(SUPA_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const admin = createClient(SUPA_URL, SRK, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: uProf } = await admin
    .from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
  if (!uProf) return json({ error: 'User profile not found' }, 404);

  // ── فحص الاشتراك عبر mediator_subscriptions (يدعم تعدد الوسطاء) ──
  const { data: existingSub } = await admin
    .from('mediator_subscriptions')
    .select('med_sub_internal_id')
    .eq('id', user.id)
    .eq('mediator_id', mediator_id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existingSub) return json({ error: 'Already subscribed to this mediator' }, 409);

  const { data: mProf } = await admin
    .from('profiles').select('role, full_name').eq('id', mediator_id).single();
  if (mProf?.role !== 'mediator') return json({ error: 'Target is not a mediator' }, 400);

  const { data: uWallet } = await admin.from('wallets').select('balance').eq('id', user.id).single();
  if (!uWallet)               return json({ error: 'User wallet not found' }, 404);
  if (uWallet.balance < coins) return json({ error: 'Insufficient balance' }, 400);

  const { data: mWallet } = await admin
    .from('mediator_wallets')
    .select('total_coins, total_tnd, pending_tnd, total_subscription_events')
    .eq('mediator_id', mediator_id).single();
  if (!mWallet) return json({ error: 'Mediator wallet not found' }, 404);

  // FIFO
  const { data: payments } = await admin
    .from('konnect_payments').select('payment_id, coins_amount, tnd_amount')
    .eq('user_id', user.id).eq('status', 'completed').order('created_at', { ascending: true });

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
  if (remaining > 0) return json({ error: `FIFO exhausted — ${remaining} coins unmatched` }, 400);

  const { data: cfg } = await admin
    .from('economy_config').select('value').eq('key', 'mediator_commission_rate').maybeSingle();
  const rate: number = typeof cfg?.value === 'number' ? cfg.value : (cfg?.value?.rate ?? 0.7);
  const share = totalTnd * rate;

  const now        = new Date().toISOString();
  const expires    = new Date();
  expires.setMonth(expires.getMonth() + 1);
  const expiresISO = expires.toISOString();

  const newUserBal  = uWallet.balance - coins;
  const newMedCoins = (mWallet.total_coins ?? 0) + coins;
  const newMedTnd   = (mWallet.total_tnd   ?? 0) + share;
  const newMedPend  = (mWallet.pending_tnd ?? 0) + share;
  const newEvents   = (mWallet.total_subscription_events ?? 0) + 1;
  const userName    = uProf.full_name  ?? 'مستخدم';
  const userAvatar  = uProf.avatar_url ?? null;

  // STEP A: تحديث المحافظ أولاً
  const [wR, mwR] = await Promise.all([
    admin.from('wallets').update({ balance: newUserBal, updated_at: now }).eq('id', user.id),
    admin.from('mediator_wallets').update({
      total_coins: newMedCoins, total_tnd: newMedTnd,
      pending_tnd: newMedPend,
      total_subscription_events: newEvents,
      updated_at: now,
    }).eq('mediator_id', mediator_id),
  ]);
  if (wR.error || mwR.error)
    return json({ error: 'Failed to update wallets', details: [wR.error?.message, mwR.error?.message] }, 500);

  // STEP B: باقي العمليات
  const [clientRes, medSubRes, txUserRes, txMedRes, fifoRes] = await Promise.all([

    // INSERT جديد دائماً → يزيد COUNT في get_mediators()
    admin.from('mediator_clients').insert({
      user_id: user.id, mediator_id, coins,
      tnd_value: totalTnd, status: 'active',
      expires_at: expiresISO, created_at: now,
    }),

    // UPSERT mediator_subscriptions → حالة الاشتراك الحالية
    admin.from('mediator_subscriptions').upsert({
      id: user.id, mediator_id, status: 'active',
      expires_at: expiresISO, created_at: now,
    }, { onConflict: 'id,mediator_id', ignoreDuplicates: false }),

    // معاملة المستخدم
    admin.from('point_transactions').insert({
      user_id: user.id, mediator_id, amount: -coins,
      balance_after: newUserBal, action: 'subscription', source: 'subscription',
      user_name: userName, user_avatar: userAvatar,
      notes: `اشتراك مع الوسيط — ${coins.toLocaleString('ar-TN')} عملة`,
    }),

    // معاملة الوسيط
    admin.from('point_transactions').insert({
      user_id: user.id, mediator_id, amount: coins,
      balance_after: newMedCoins, action: 'deposit', source: 'mediator_income',
      user_name: userName, user_avatar: userAvatar, value_tnd: share,
      notes: `اشتراك عميل: ${userName} — ${coins.toLocaleString('ar-TN')} عملة (${share.toFixed(3)} د.ت)`,
    }),

    // FIFO
    usageInserts.length > 0
      ? admin.from('payment_usages').insert(usageInserts)
      : Promise.resolve({ error: null }),
  ]);

  const errs = [clientRes, medSubRes, txUserRes, txMedRes, fifoRes]
    .map((r, i) => r?.error ? `B${i+1}: ${r.error.message}` : null).filter(Boolean);
  if (errs.length) console.error('[subscribe] secondary errors:', errs);

  return json({
    success: true, coins, tnd_value: totalTnd, mediator_share: share,
    commission_rate: rate, expires_at: expiresISO, total_events: newEvents,
    ...(errs.length && { warnings: errs }),
  });
});