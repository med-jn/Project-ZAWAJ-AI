'use client';
/**
 * 📁 app/payment/success/page.tsx
 * صفحة وسيطة — يُعاد التوجيه إليها من Konnect بعد الدفع
 * الـ useKonnectPayment يستمع لها عبر Capacitor appUrlOpen
 * ثم يتحقق من التأكيد عبر Supabase Realtime
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // إغلاق تلقائي بعد 3 ثوانٍ إذا لم يُغلق Capacitor Browser
    const t = setTimeout(() => router.replace('/packages'), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-8"
      style={{ background: 'var(--bg-base)' }}
      dir="rtl"
    >
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-5xl animate-bounce">
        ✅
      </div>
      <h1 className="text-white font-black text-2xl text-center">
        تم الدفع بنجاح!
      </h1>
      <p className="text-white/50 text-sm text-center">
        جارٍ التحقق وإضافة نقاطك…
      </p>
      <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
  );
}