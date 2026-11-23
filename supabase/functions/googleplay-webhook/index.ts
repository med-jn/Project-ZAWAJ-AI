/**
 * 📁 supabase/functions/googleplay-webhook/index.ts — ZAWAJ AI
 *
 * يستقبل أحداث RevenueCat (مشتريات Google Play) ويحدّث الرصيد بأمان
 * ✅ نفس هيكل konnect-webhook (idempotency + service_role + معاملات متوازية)
 * ✅ لا يمس منطق subscribe-to-mediator: يكتب فـ konnect_payments بـ payment_method='google_play'
 * ✅ economy_config هو المرجع الوحيد لعدد العملات (coins + bonus) وللقيمة المرجعية بالدينار
 *
 * ── طريقة النشر ──────────────────────────────────────────────────
 *   supabase functions deploy googleplay-webhook --no-verify-jwt
 *
 * ── المتغيرات البيئية المطلوبة ───────────────────────────────────
 *   supabase secrets set REVENUECAT_WEBHOOK_SECRET=your_secret
 *   (نفس القيمة تُحط فـ RevenueCat > Integrations > Webhooks > Authorization Header)
 *   (SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY تُضاف تلقائياً)
 */ import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// طابق هذي المعرّفات مع الـ Product IDs اللي تصنعهم فـ Google Play Console / RevenueCat
const PRODUCT_TO_PACKAGE = {
  pkg_s: 'pkg_s',
  pkg_m: 'pkg_m',
  pkg_l: 'pkg_l'
};
// أحداث الشراء الفعلي فقط (نتجاهل التجديد/الإلغاء/التحويل بين مستخدمين... إلخ)
const VALID_TYPES = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE'
]);
Deno.serve(async (req)=>{
  // ── 1. قبول POST فقط ─────────────────────────────────────────
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405
    });
  }
  // ── 2. التحقق من مصدر الطلب (Authorization header السري) ────
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  const auth = req.headers.get('Authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response('Unauthorized', {
      status: 401
    });
  }
  // ── 3. قراءة الـ payload ──────────────────────────────────────
  let payload;
  try {
    payload = await req.json();
  } catch  {
    return new Response('Invalid JSON', {
      status: 400
    });
  }
  const ev = payload.event;
  if (!ev) return new Response('Missing event', {
    status: 400
  });
  // نتجاهل أحداث غير الشراء — نرجع 200 حتى لا يعيد RevenueCat الإرسال
  if (!VALID_TYPES.has(ev.type)) {
    console.log('[googleplay-webhook] Ignored event type:', ev.type);
    return new Response('Ignored event type', {
      status: 200
    });
  }
  if (ev.store !== 'PLAY_STORE') {
    console.log('[googleplay-webhook] Ignored store:', ev.store);
    return new Response('Ignored store', {
      status: 200
    });
  }
  const packageId = PRODUCT_TO_PACKAGE[ev.product_id];
  if (!packageId) {
    console.error('[googleplay-webhook] Unknown product_id:', ev.product_id);
    return new Response('Unknown product', {
      status: 200
    });
  }
  const userId = ev.app_user_id;
  if (!userId) return new Response('Missing app_user_id', {
    status: 400
  });
  // ── 4. Supabase بصلاحية الخادم (service_role) ─────────────────
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false
    }
  });
  // ── 5. جلب تعريف الباقة + القيمة المرجعية بالدينار من economy_config ──
  const { data: cfgRows, error: cfgErr } = await supabase.from('economy_config').select('key, value').in('key', [
    'packages',
    'currency_pricing'
  ]);
  if (cfgErr || !cfgRows?.length) {
    console.error('[googleplay-webhook] config error', cfgErr);
    return new Response('Config error', {
      status: 500
    });
  }
  const cfg = Object.fromEntries(cfgRows.map((r)=>[
      r.key,
      r.value
    ]));
  const pkg = cfg.packages?.find((p)=>p.id === packageId);
  if (!pkg) {
    console.error('[googleplay-webhook] Package not found in economy_config:', packageId);
    return new Response('Package not found in config', {
      status: 500
    });
  }
  const coinsToCredit = pkg.coins + (pkg.bonus ?? 0);
  const tndReference = cfg.currency_pricing?.TND?.packages?.[packageId] ?? 0;
  // ── 6. منع المعالجة المزدوجة (Idempotency عبر transaction_id) ──
  const { data: existing } = await supabase.from('konnect_payments').select('payment_id').eq('provider_transaction_id', ev.transaction_id).maybeSingle();
  if (existing) {
    console.log('[googleplay-webhook] Already processed:', ev.transaction_id);
    return new Response('Already processed', {
      status: 200
    });
  }
  // ── 7. جلب رصيد المحفظة الحالي ───────────────────────────────
  const { data: wallet, error: walletErr } = await supabase.from('wallets').select('balance, balance_free').eq('id', userId).single();
  if (walletErr || !wallet) {
    console.error('[googleplay-webhook] Wallet not found for user:', userId);
    return new Response('Wallet not found', {
      status: 404
    });
  }
  const newBalance = wallet.balance + coinsToCredit;
  // ── 8. تسجيل الدفعة + تحديث الرصيد + معاملة (معاً) ────────────
  const [payRes, walletRes, txRes] = await Promise.all([
    supabase.from('konnect_payments').insert({
      user_id: userId,
      package_id: packageId,
      coins_amount: coinsToCredit,
      currency: ev.currency ?? 'USD',
      display_amount: ev.price ?? 0,
      tnd_amount: tndReference,
      status: 'completed',
      payment_method: 'google_play',
      provider_transaction_id: ev.transaction_id,
      completed_at: new Date().toISOString()
    }),
    supabase.from('wallets').update({
      balance: newBalance,
      updated_at: new Date().toISOString()
    }).eq('id', userId),
    supabase.from('point_transactions').insert({
      user_id: userId,
      amount: coinsToCredit,
      balance_after: newBalance + wallet.balance_free,
      source: 'google_play',
      notes: `شراء ${coinsToCredit} نقطة — ${packageId} (Google Play)`
    })
  ]);
  // ── 9. التحقق من نجاح جميع العمليات ────────────────────────
  const errors = [
    payRes.error,
    walletRes.error,
    txRes.error
  ].filter(Boolean);
  if (errors.length > 0) {
    console.error('[googleplay-webhook] DB errors:', errors);
    // نعيد 500 لكي يعيد RevenueCat الإرسال (retry مُفعّل افتراضياً)
    return new Response('DB error', {
      status: 500
    });
  }
  console.log(`[googleplay-webhook] ✅ +${coinsToCredit} coins → user ${userId}`);
  return new Response('OK', {
    status: 200
  });
});
