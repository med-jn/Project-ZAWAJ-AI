/**
 * 📁 supabase/functions/konnect-initiate/index.ts — ZAWAJ AI
 * 
 * Edge Function تستبدل app/api/payments/initiate/route.ts
 * تعمل مع output:'export' (static build) — لا تحتاج Next.js server
 *
 * ── النشر ─────────────────────────────────────────────────────
 *   supabase functions deploy konnect-initiate
 *
 * ── المتغيرات المطلوبة ────────────────────────────────────────
 *   supabase secrets set KONNECT_API_KEY=xxx
 *   supabase secrets set KONNECT_WALLET_ID=xxx
 *   supabase secrets set APP_URL=https://zawaj-ai.vercel.app
 *   supabase secrets set KONNECT_WEBHOOK_URL=https://xxx.supabase.co/functions/v1/konnect-webhook
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const KONNECT_API = 'https://api.preprod.konnect.network/api/v2';
const KONNECT_KEY    = Deno.env.get('KONNECT_API_KEY')!;
const KONNECT_WALLET = Deno.env.get('KONNECT_WALLET_ID')!;
const APP_URL        = Deno.env.get('APP_URL')!;
const WEBHOOK_URL    = Deno.env.get('KONNECT_WEBHOOK_URL')!;

// ── CORS Headers ──────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS });
  }

  try {
    // ── التحقق من هوية المستخدم عبر JWT ───────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── تحميل إعدادات الاقتصاد من DB ──────────────────────────
    const { data: configRows, error: cfgErr } = await supabase
      .from('economy_config')
      .select('key, value')
      .in('key', ['currency_pricing', 'tnd_rates', 'packages', 'custom_range']);

    if (cfgErr || !configRows?.length) {
      return new Response(JSON.stringify({ error: 'Config error' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const cfg: Record<string, any> = Object.fromEntries(
      configRows.map(r => [r.key, r.value])
    );

    // ── قراءة المدخلات ─────────────────────────────────────────
    const body     = await req.json();
    const currency = body.currency as string;
    const type     = body.type     as 'package' | 'custom';

    const currencyConf = cfg.currency_pricing[currency];
    if (!currencyConf) {
      return new Response(JSON.stringify({ error: 'Invalid currency' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const tndRate = cfg.tnd_rates[currency] ?? 1;

    // ── حساب النقاط والسعر ─────────────────────────────────────
    let coins: number, displayPrice: number, packageId: string, label: string;

    if (type === 'package') {
      const pid = body.packageId as string;
      const pkg = (cfg.packages as any[]).find((p: any) => p.id === pid);
      if (!pkg || !currencyConf.packages[pid]) {
        return new Response(JSON.stringify({ error: 'Invalid packageId' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
      coins = pkg.coins; displayPrice = currencyConf.packages[pid];
      packageId = pid;   label = pkg.label;

    } else if (type === 'custom') {
      const { min, max, step } = cfg.custom_range;
      const rawCoins = Number(body.coins);
      if (!Number.isInteger(rawCoins) || rawCoins < min || rawCoins > max || rawCoins % step !== 0) {
        return new Response(JSON.stringify({ error: `coins must be ${min}–${max} step ${step}` }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
      const basePer1000 = currencyConf.packages['pkg_s'];
      coins = rawCoins; displayPrice = parseFloat(((rawCoins / 1000) * basePer1000).toFixed(3));
      packageId = `custom_${rawCoins}`; label = `شراء حر — ${rawCoins} نقطة`;

    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const tndPrice = parseFloat((displayPrice * tndRate).toFixed(3));
    const millimes = Math.round(tndPrice * 1000);

    // ── إنشاء سجل pending ──────────────────────────────────────
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
      return new Response(JSON.stringify({ error: 'DB error' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── طلب بدء الدفع من Konnect ───────────────────────────────
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
        webhook:                WEBHOOK_URL,
        silentWebhook:          true,
        successUrl:             `${APP_URL}/payment/success?pid=${payment.payment_id}`,
        failUrl:                `${APP_URL}/payment/fail?pid=${payment.payment_id}`,
        acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
        addPaymentFeesToAmount: false,
      }),
    });

    if (!konnectRes.ok) {
      await supabase.from('konnect_payments')
        .update({ status: 'failed' }).eq('payment_id', payment.payment_id);
      return new Response(JSON.stringify({ error: 'Payment gateway error' }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { payUrl, paymentRef } = await konnectRes.json();

    await supabase.from('konnect_payments')
      .update({ konnect_ref: paymentRef, konnect_pay_url: payUrl })
      .eq('payment_id', payment.payment_id);

    return new Response(JSON.stringify({
      payUrl, paymentId: payment.payment_id,
      summary: { coins, label, displayPrice, currencySymbol: currencyConf.symbol, currency },
    }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[konnect-initiate]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});