'use client';
import { Brand } from '@/components/ui/brand';
import Footer from '@/components/layout/Footer';

export default function TermsContent() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 pb-20 font-cairo" dir="rtl">
      <div className="flex flex-col items-center mb-16 gap-4 border-b border-[var(--glass-border)] pb-10 text-center">
        <div className="scale-75 origin-center mb-2"><Brand /></div>
        <h1 className="text-3xl font-black text-[var(--color-primary)]">شروط الخدمة</h1>
        <p className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase opacity-40">Terms & Conditions of Use</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-16 leading-relaxed text-right">
        {/* Section 1 */}
        <section className="relative pr-6 border-r-2 border-[var(--color-primary)]/20">
          <h2 className="text-xl font-bold text-[var(--color-gold-hover)] mb-4 italic">1. التزامات المستخدم / User Obligations</h2>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>يجب ألا يقل عمر المستخدم عن 18 عاماً. يُحظر تماماً انتحال الشخصيات أو استخدام المنصة لأغراض تجارية أو غير قانونية.</p>
            <p className="text-[12px] italic opacity-60 font-sans" dir="ltr">
              Users must be 18+. Impersonation or using the platform for commercial/illegal purposes is strictly prohibited.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="relative pr-6 border-r-2 border-[var(--color-primary)]/20">
          <h2 className="text-xl font-bold text-[var(--color-gold-hover)] mb-4 italic">2. نظام النقاط / Virtual Credits</h2>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>النقاط المشتراة عبر التطبيق هي ميزات افتراضية لاستخدام الخدمة فقط، ولا يمكن استبدالها بأموال نقدية تحت أي ظرف.</p>
            <p className="text-[12px] italic opacity-60 font-sans" dir="ltr">
              Purchased credits are virtual features for service use only and are non-refundable and non-exchangeable for cash.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}