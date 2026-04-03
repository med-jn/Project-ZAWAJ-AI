'use client';
/**
 * 📁 app/payment/fail/page.tsx
 * صفحة وسيطة — يُعاد التوجيه إليها من Konnect عند فشل الدفع
 */
import { useRouter } from 'next/navigation';

export default function PaymentFailPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-8"
      style={{ background: 'var(--bg-base)' }}
      dir="rtl"
    >
      <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center text-5xl">
        ❌
      </div>
      <h1 className="text-white font-black text-2xl text-center">
        فشل الدفع
      </h1>
      <p className="text-white/50 text-sm text-center">
        لم يُخصم أي مبلغ من رصيدك.
      </p>
      <button
        onClick={() => router.replace('/packages')}
        className="btn-premium px-8 py-4 text-base"
      >
        العودة للمتجر
      </button>
    </div>
  );
}