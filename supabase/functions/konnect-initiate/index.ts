/**
 * 📁 supabase/functions/konnect-initiate/index.ts — ZAWAJ AI
 * ✅ successUrl/failUrl تستخدم zawaj:// scheme للـ deep link على Android
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const KONNECT_API    = 'https://api.preprod.konnect.network/api/v2'; // sandbox
const KONNECT_KEY    = Deno.env.get('KONNECT_API_KEY')!;
const KONNECT_WALLET = Deno.env.get('KONNECT_WALLET_ID')!;

// ✅ Deep link scheme مسجّل في AndroidManifest.xml
const SUCCESS_URL = 'zawaj://payment/success';
const FAIL_URL    = 'zawaj://payment/fail';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405 });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    // ── إعدادات الاقتصاد ──────────────────────────────────
    const { data: configRows, error: cfgErr } = await supabase
      .from('economy_config')
      .select('key, value')
      .in('key', ['currency_pricing', 'tnd_rates', 'packages', 'custom_range']);

    if (cfgErr || !configRows?.length) {
      console.error('[config]', cfgErr);
      return json({ error: 'Config error' }, 500);
    }

    const cfg: Record<string, any> =
      Object.fromEntries(configRows.map(r => [r.key, r.value]));

    const body     = await req.json();
    const currency = body.currency as string;
    const type     = body.type     as 'package' | 'custom';

    const currencyConf = cfg.currency_pricing?.[currency];
    if (!currencyConf) return json({ error: 'Invalid currency' }, 400);

    const tndRate = cfg.tnd_rates?.[currency] ?? 1;

    let coins: number, displayPrice: number, packageId: string, label: string;

    if (type === 'package') {
      const pid = body.packageId as string;
      const pkg = (cfg.packages as any[])?.find((p: any) => p.id === pid);
      if (!pkg) return json({ error: 'Invalid packageId' }, 400);
      coins = pkg.coins; displayPrice = currencyConf.packages[pid] ?? 0;
      packageId = pid;   label = pkg.label;

    } else if (type === 'custom') {
      const { min, max, step } = cfg.custom_range;
      const rawCoins = Number(body.coins);
      if (!Number.isInteger(rawCoins) || rawCoins < min || rawCoins > max || rawCoins % step !== 0)
        return json({ error: `coins: ${min}–${max} step ${step}` }, 400);
      coins = rawCoins;
      displayPrice = parseFloat(((rawCoins / 1000) * (currencyConf.packages['pkg_s'] ?? 0)).toFixed(3));
      packageId = `custom_${rawCoins}`;
      label = `شراء حر — ${rawCoins} نقطة`;

    } else {
      return json({ error: 'Invalid type' }, 400);
    }

    const tndPrice = parseFloat((displayPrice * tndRate).toFixed(3));
    const millimes = Math.round(tndPrice * 1000);

    // ── إنشاء سجل الدفع ────────────────────────────────────
    const { data: payment, error: dbErr } = await supabase
      .from('konnect_payments')
      .insert({
        user_id: user.id, package_id: packageId,
        coins_amount: coins, currency,
        display_amount: displayPrice, tnd_amount: tndPrice,
        status: 'pending',
      })
      .select('payment_id')
      .single();

    if (dbErr || !payment) {
      console.error('[DB]', dbErr);
      return json({ error: 'DB error' }, 500);
    }

    // ── طلب Konnect ────────────────────────────────────────
    const konnectRes = await fetch(`${KONNECT_API}/payments/init-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KONNECT_KEY },
      body: JSON.stringify({
        receiverWalletId:       KONNECT_WALLET,
        token:                  'TND',
        amount:                 millimes,
        type:                   'immediate',
        description:            `${label} — ZAWAJ AI`,
        orderId:                payment.payment_id,
        webhook:                Deno.env.get('KONNECT_WEBHOOK_URL')!,
        silentWebhook:          true,
        successUrl:             `${SUCCESS_URL}?pid=${payment.payment_id}`,
        failUrl:                `${FAIL_URL}?pid=${payment.payment_id}`,
        acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
        addPaymentFeesToAmount: false,
      }),
    });

    if (!konnectRes.ok) {
      const kErr = await konnectRes.text();
      console.error('[Konnect]', konnectRes.status, kErr);
      await supabase.from('konnect_payments')
        .update({ status: 'failed' }).eq('payment_id', payment.payment_id);
      return json({ error: 'Payment gateway error', detail: kErr }, 502);
    }

    const { payUrl, paymentRef } = await konnectRes.json();

    await supabase.from('konnect_payments')
      .update({ konnect_ref: paymentRef, konnect_pay_url: payUrl })
      .eq('payment_id', payment.payment_id);

    return json({
      payUrl, paymentId: payment.payment_id,
      summary: { coins, label, displayPrice, currencySymbol: currencyConf.symbol, currency },
    });

  } catch (err) {
    console.error('[unexpected]', err);
    return json({ error: 'Internal server error' }, 500);
  }
});