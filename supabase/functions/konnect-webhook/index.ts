/**
 * 📁 supabase/functions/konnect-webhook/index.ts — ZAWAJ AI
 * 
 * Supabase Edge Function — Deno Runtime
 * 
 * وظيفتها: استقبال إشعار Konnect عند اكتمال الدفع والتحقق منه
 * وإضافة النقاط لمحفظة المستخدم بشكل آمن وذري
 *
 * ── طريقة النشر ──────────────────────────────────────────────────
 *   supabase functions deploy konnect-webhook --no-verify-jwt
 *
 * ── المتغيرات البيئية المطلوبة ───────────────────────────────────
 *   supabase secrets set KONNECT_API_KEY=your_key
 *   (SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY تُضاف تلقائياً)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── نوع payload من Konnect ──────────────────────────────────────
interface KonnectWebhookPayload {
  payment_ref: string;
  order_id:    string;   // = payment_id في جدولنا
}

// ── نوع استجابة Konnect عند التحقق ──────────────────────────────
interface KonnectPaymentStatus {
  payment: {
    _id:    string;
    ref:    string;
    status: 'pending' | 'completed' | 'cancelled' | 'failed';
    amount: number;   // بالمليمات
    type:   string;
  };
}

// ════════════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {

  // ── 1. قبول POST فقط ─────────────────────────────────────────
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // ── 2. قراءة الـ payload ──────────────────────────────────────
  let payload: KonnectWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { payment_ref, order_id } = payload;

  if (!payment_ref || !order_id) {
    return new Response('Missing payment_ref or order_id', { status: 400 });
  }

  // ── 3. التحقق من الدفع مع Konnect (لا نثق بالـ payload فقط) ──
  const konnectKey = Deno.env.get('KONNECT_API_KEY');
  if (!konnectKey) {
    console.error('[konnect-webhook] KONNECT_API_KEY not set');
    return new Response('Server config error', { status: 500 });
  }

  let konnectStatus: KonnectPaymentStatus;
  try {
    const verifyRes = await fetch(
      `https://api.konnect.network/api/v2/payments/${payment_ref}`,
      { headers: { 'x-api-key': konnectKey } }
    );

    if (!verifyRes.ok) {
      console.error('[konnect-webhook] Konnect verify failed:', verifyRes.status);
      return new Response('Konnect verify error', { status: 502 });
    }

    konnectStatus = await verifyRes.json();
  } catch (e) {
    console.error('[konnect-webhook] Network error:', e);
    return new Response('Network error', { status: 502 });
  }

  // ── 4. التحقق: الدفع مكتمل؟ ──────────────────────────────────
  if (konnectStatus.payment?.status !== 'completed') {
    // نعيد 200 لأن Konnect قد يعيد الإرسال — نتجاهل فقط
    console.log(`[konnect-webhook] Payment ${payment_ref} not completed:`, konnectStatus.payment?.status);
    return new Response('Not completed', { status: 200 });
  }

  // ── 5. Supabase بصلاحية الخادم (service_role) ─────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  // ── 6. جلب سجل الدفع من قاعدة البيانات ──────────────────────
  const { data: kp, error: kpErr } = await supabase
    .from('konnect_payments')
    .select('payment_id, user_id, coins_amount, package_id, status')
    .eq('payment_id', order_id)
    .single();

  if (kpErr || !kp) {
    console.error('[konnect-webhook] Payment record not found:', order_id);
    return new Response('Payment record not found', { status: 404 });
  }

  // ── 7. منع المعالجة المزدوجة (Idempotency) ───────────────────
  if (kp.status === 'completed') {
    console.log(`[konnect-webhook] Already processed: ${order_id}`);
    return new Response('Already processed', { status: 200 });
  }

  // ── 8. جلب رصيد المحفظة الحالي ───────────────────────────────
  const { data: wallet, error: walletErr } = await supabase
    .from('wallets')
    .select('balance, balance_free')
    .eq('id', kp.user_id)
    .single();

  if (walletErr || !wallet) {
    console.error('[konnect-webhook] Wallet not found for user:', kp.user_id);
    return new Response('Wallet not found', { status: 404 });
  }

  const newBalance = wallet.balance + kp.coins_amount;

  // ── 9. إضافة النقاط + تسجيل المعاملة (عمليتان معاً) ──────────
  const [walletUpdate, txInsert, kpUpdate] = await Promise.all([

    supabase
      .from('wallets')
      .update({
        balance:    newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', kp.user_id),

    supabase
      .from('point_transactions')
      .insert({
        user_id:       kp.user_id,
        amount:        kp.coins_amount,
        balance_after: newBalance + wallet.balance_free,
        source:        'konnect',
        payment_id:    kp.payment_id,
        notes:         `شراء ${kp.coins_amount} نقطة — ${kp.package_id}`,
      }),

    supabase
      .from('konnect_payments')
      .update({
        status:          'completed',
        konnect_ref:     payment_ref,
        webhook_payload: payload,
        completed_at:    new Date().toISOString(),
      })
      .eq('payment_id', order_id),
  ]);

  // ── 10. التحقق من نجاح جميع العمليات ────────────────────────
  const errors = [walletUpdate.error, txInsert.error, kpUpdate.error].filter(Boolean);
  if (errors.length > 0) {
    console.error('[konnect-webhook] DB errors:', errors);
    // نعيد 500 لكي يعيد Konnect الإرسال (إذا كان retry مُفعّلاً)
    return new Response('DB error', { status: 500 });
  }

  console.log(`[konnect-webhook] ✅ +${kp.coins_amount} coins → user ${kp.user_id}`);
  return new Response('OK', { status: 200 });
});