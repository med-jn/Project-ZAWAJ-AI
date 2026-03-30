'use client';
import { Brand } from '@/components/ui/brand';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 pb-20 font-cairo" dir="rtl">
      <div className="flex flex-col items-center mb-10 gap-4 border-b border-[var(--glass-border)] pb-8">
        <div className="scale-50 origin-center -mb-4">
          <Brand />
        </div>
        <h1 className="text-2xl font-black text-[var(--color-primary)]">شروط الخدمة</h1>
        <p className="text-xs opacity-50 font-sans tracking-widest uppercase">Terms of Service</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-10">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-gold-hover)] border-r-4 border-[var(--color-primary)] pr-3">
            1. شروط الاستخدام
          </h2>
          <ul className="list-none space-y-3 text-sm text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">●</span>
              يجب أن يكون المستخدم مسلماً، جاداً في طلب الزواج، وبالغاً للسن القانوني (18+).
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">●</span>
              يمنع منعاً باتاً نشر أرقام الهواتف أو روابط التواصل الخارجي في الملفات الشخصية العامة.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-gold-hover)] border-r-4 border-[var(--color-primary)] pr-3">
            2. نظام النقاط (Economy)
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-7">
            النقاط المشتراة أو المكتسبة عبر الإعلانات هي وسيلة لاستخدام ميزات التطبيق (الإعجاب، فتح المحادثة). هذه النقاط غير قابلة للاسترداد نقدياً.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-gold-hover)] border-r-4 border-[var(--color-primary)] pr-3">
            3. الوسطاء (Mediators)
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-7">
            يقر المستخدم بأن الوسطاء المعتمدين في التطبيق يمكنهم الاطلاع على البيانات العامة لتسهيل عملية الترشيح والمطابقة.
          </p>
        </section>
      </div>
      <Footer/>
    </div>
  );
}