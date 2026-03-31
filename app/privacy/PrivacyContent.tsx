'use client';
import { Brand } from '@/components/ui/brand';
import Footer from '@/components/layout/Footer';

export default function PrivacyContent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 pb-20 font-cairo selection:bg-[var(--color-primary)]/30" dir="rtl">
      <div className="flex flex-col items-center mb-16 gap-4 border-b border-[var(--glass-border)] pb-10 text-center">
        <div className="scale-60 origin-center mb-2"><Brand /></div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-primary)]">سياسة الخصوصية</h1>
        <p className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase opacity-40">Privacy & Policy</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-16 leading-relaxed">
        
        {/* Section 1 */}
        <section className="relative pr-6 border-r-2 border-[var(--color-primary)]/20">
          <div className="flex justify-between items-baseline mb-4 gap-4">
            <h2 className="text-xl font-bold text-[var(--color-gold-hover)]">1. جمع البيانات ومعالجتها</h2>
            <span className="text-[10px] font-sans opacity-30 uppercase font-bold tracking-widest">Data Collection</span>
          </div>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>نقوم بجمع البيانات الشخصية (الاسم، العمر، الموقع) والبيانات الحساسة (التوجه الديني، الحالة الاجتماعية) لغرض وحيد وهو تحسين خوارزمية المطابقة.</p>
            <p className="text-[12px] italic opacity-60 font-sans" dir="ltr">
              We collect personal and sensitive data (Religious commitment, Social status) solely to enhance the AI matching algorithm.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="relative pr-6 border-r-2 border-[var(--color-primary)]/20">
          <div className="flex justify-between items-baseline mb-4 gap-4">
            <h2 className="text-xl font-bold text-[var(--color-gold-hover)]">2. أمن السحابة والمدفوعات</h2>
            <span className="text-[10px] font-sans opacity-30 uppercase font-bold tracking-widest">Security & Payments</span>
          </div>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>تتم استضافة البيانات على خوادم Supabase المشفرة ببروتوكولات SSL. العمليات المالية مشفرة بالكامل عبر بوابة Konnect؛ نحن لا نخزن بيانات بطاقتك البنكية نهائياً.</p>
            <p className="text-[12px] italic opacity-60 font-sans" dir="ltr">
              Data is hosted on encrypted Supabase servers. Financial transactions are handled via Konnect gateway; no credit card data is stored on our servers.
            </p>
          </div>
        </section>

        {/* Section 3 - AI Safety */}
        <section className="relative pr-6 border-r-2 border-[var(--color-primary)]/20">
          <div className="flex justify-between items-baseline mb-4 gap-4">
            <h2 className="text-xl font-bold text-[var(--color-gold-hover)]">3. معايير سلامة الذكاء الاصطناعي</h2>
            <span className="text-[10px] font-sans opacity-30 uppercase font-bold tracking-widest">AI Safety Measures</span>
          </div>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>تخضع الصور والنصوص المرفوعة لفحص آلي بواسطة Gemini AI لضمان خلوها من المحتوى غير اللائق أو المخالف لسياساتنا.</p>
            <p className="text-[12px] italic opacity-60 font-sans" dir="ltr">
              All uploaded content is scanned by Gemini AI to ensure compliance with safety standards and prevent inappropriate content.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}