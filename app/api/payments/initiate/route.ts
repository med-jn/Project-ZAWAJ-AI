/**
 * 📁 app/api/payments/initiate/route.ts — ZAWAJ AI
 * ✅ إصلاح BUG: @supabase/ssr بدلاً من @supabase/auth-helpers-nextjs (محزمة قديمة)
 * ✅ التسعير يُقرأ من جدول economy_config في Supabase (server-side فقط)
 *    → المستخدم لا يرى الأسعار الحقيقية ولا يستطيع التلاعب بها
 *    → تعديل السعر من Supabase Dashboard دون إعادة نشر
 *
 * POST /api/payments/initiate
 * Body: { type: 'package', packageId: 'pkg_s'|'pkg_m'|'pkg_l', currency: string }
 *   أو: { type: 'custom',  coins: number,                       currency: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient }        from '@supabase/ssr';
import { cookies }                   from 'next/headers';
import { toMillimes }                from '@/constants/ecomomy';

// ── أنواع البيانات المقروءة من DB ────────────────────────────────
interface CurrencyConfig {
  symbol:   string;
  name:     string;
  packages: Record<string, number>;
}
interface PackageConfig {
  id:         string;
  coins:      number;
  label:      string;
  is_popular: boolean;
}
interface CustomRange {
  min:  number;
  max:  number;
  step: number;
}

// ── دالة إنشاء Supabase Client لـ Route Handler ─────────────────
function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()                { return cookieStore.getAll(); },
        setAll(cookiesToSet)    {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Route Handler — يمكن تجاهل أخطاء set */ }
        },
      },
    }
  );
}

// ── دالة قراءة إعدادات الاقتصاد من DB ────────────────────────────
async function loadEconomyConfig(supabase: ReturnType<typeof createSupabaseClient>) {
  const { data, error } = await supabase
    .from('economy_config')
    .select('key, value')
    .in('key', ['currency_pricing', 'tnd_rates', 'packages', 'custom_range']);

  if (error || !data?.length) {
    throw new Error(`فشل تحميل إعدادات الاقتصاد: ${error?.message}`);
  }

  const config = Object.fromEntries(data.map(r => [r.key, r.value]));

  return {
    currencyPricing: config.currency_pricing as Record<string, CurrencyConfig>,
    tndRates:        config.tnd_rates        as Record<string, number>,
    packages:        config.packages         as PackageConfig[],
    customRange:     config.custom_range     as CustomRange,
  };
}

const KONNECT_API    = 'https://api.konnect.network/api/v2';
const KONNECT_KEY    = process.env.KONNECT_API_KEY!;
const KONNECT_WALLET = process.env.KONNECT_WALLET_ID!;
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL!;
const WEBHOOK_URL    = process.env.KONNECT_WEBHOOK_URL!;

// ════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // ── التحقق من هوية المستخدم ──────────────────────────────────
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── تحميل التسعير من DB ──────────────────────────────────────
    const { currencyPricing, tndRates, packages, customRange } =
      await loadEconomyConfig(supabase);

    // ── قراءة المدخلات ───────────────────────────────────────────
    const body     = await req.json();
    const currency = body.currency as string;
    const type     = body.type     as 'package' | 'custom';

    // التحقق من العملة
    if (!currencyPricing[currency]) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }

    const currencyConf = currencyPricing[currency];
    const tndRate      = tndRates[currency] ?? 1;

    // ── حساب النقاط والسعر ───────────────────────────────────────
    let coins:        number;
    let displayPrice: number;
    let packageId:    string;
    let label:        string;

    if (type === 'package') {
      const pid = body.packageId as string;
      const pkg = packages.find(p => p.id === pid);
      if (!pkg) return NextResponse.json({ error: 'Invalid packageId' }, { status: 400 });
      if (!currencyConf.packages[pid]) {
        return NextResponse.json({ error: 'Price not configured for this currency' }, { status: 400 });
      }
      coins        = pkg.coins;
      displayPrice = currencyConf.packages[pid];
      packageId    = pid;
      label        = pkg.label;

    } else if (type === 'custom') {
      const { min, max, step } = customRange;
      const rawCoins           = Number(body.coins);
      if (!Number.isInteger(rawCoins) || rawCoins < min || rawCoins > max || rawCoins % step !== 0) {
        return NextResponse.json({ error: `coins must be ${min}–${max} step ${step}` }, { status: 400 });
      }
      // سعر الشراء الحر: (coins / 1000) × سعر pkg_s
      const basePricePer1000 = currencyConf.packages['pkg_s'];
      coins        = rawCoins;
      displayPrice = parseFloat(((rawCoins / 1000) * basePricePer1000).toFixed(3));
      packageId    = `custom_${rawCoins}`;
      label        = `شراء حر — ${rawCoins.toLocaleString()} نقطة`;

    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // التحويل إلى TND ثم مليمات
    const tndPrice = parseFloat((displayPrice * tndRate).toFixed(3));
    const millimes = toMillimes(tndPrice);

    // ── إنشاء سجل pending ────────────────────────────────────────
    const { data: payment, error: dbErr } = await supabase
      .from('konnect_payments')
      .insert({
        user_id:        user.id,
        package_id:     packageId,
        coins_amount:   coins,
        currency,
        display_amount: displayPrice,
        tnd_amount:     tndPrice,
        status:         'pending',
      })
      .select('payment_id')
      .single();

    if (dbErr || !payment) {
      console.error('[initiate] DB insert:', dbErr);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    // ── طلب بدء الدفع من Konnect ─────────────────────────────────
    const konnectRes = await fetch(`${KONNECT_API}/payments/init-payment`, {
      method:  'POST',
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
      await supabase
        .from('konnect_payments')
        .update({ status: 'failed' })
        .eq('payment_id', payment.payment_id);
      return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 });
    }

    const { payUrl, paymentRef } = await konnectRes.json();

    await supabase
      .from('konnect_payments')
      .update({ konnect_ref: paymentRef, konnect_pay_url: payUrl })
      .eq('payment_id', payment.payment_id);

    // ── الرد للعميل (بدون أسعار TND — معلومات العرض فقط) ────────
    return NextResponse.json({
      payUrl,
      paymentId: payment.payment_id,
      summary:   {
        coins,
        label,
        displayPrice,
        currencySymbol: currencyConf.symbol,
        currency,
      },
    });

  } catch (err) {
    console.error('[/api/payments/initiate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}