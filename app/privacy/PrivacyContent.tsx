'use client';
import { Brand } from '@/components/ui/brand';
import Footer from '@/components/layout/Footer';


export default function PrivacyPage() {
  const contactEmail = "contact.orcaprod@gmail.com";

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 pb-20 font-cairo" dir="rtl">
      {/* استيراد البراند مع تصغير الحجم ليناسب الوثيقة */}
      <div className="flex flex-col items-center mb-10 gap-4 border-b border-[var(--glass-border)] pb-8">
        <div className="scale-50 origin-center -mb-4">
          <Brand />
        </div>
        <h1 className="text-2xl font-black text-[var(--color-primary)]">سياسة الخصوصية</h1>
        <p className="text-xs opacity-50 font-sans tracking-widest uppercase">Privacy Policy</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-10 leading-relaxed text-right">
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-gold-hover)] border-r-4 border-[var(--color-primary)] pr-3">
            1. جمع البيانات (Data Collection)
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-7">
            نقوم بجمع البيانات الشخصية مثل الاسم الكامل، الجنس، تاريخ الميلاد، والموقع الجغرافي (يدوياً أو عبر GPS حسب اختيارك). كما نجمع بيانات تتعلق بالمستوى التعليمي، الوظيفة، والالتزام الديني والاجتماعي لغرض المطابقة فقط.
          </p>
          <p className="text-[11px] opacity-40 font-sans italic leading-tight" dir="ltr">
            We collect personal and sensitive data (Name, DOB, Location, Religious status) strictly for matchmaking purposes as defined in the app's core functions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-gold-hover)] border-r-4 border-[var(--color-primary)] pr-3">
            2. الذكاء الاصطناعي والمراقبة
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-7">
            نستخدم تقنيات Gemini AI لفحص الصور والنصوص لضمان بيئة آمنة. يتم تخزين نتائج الفحص لأغراض السلامة ومنع المحتوى غير اللائق.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-gold-hover)] border-r-4 border-[var(--color-primary)] pr-3">
            3. نظام النقاط والدفع
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-7">
            يتم تخزين رصيد النقاط والعمليات المالية عبر Supabase. عمليات الشراء تتم من خلال بوابة "كونيكت" الخارجية، ونحن لا نخزن بيانات بطاقات الائتمان الخاصة بك.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-gold-hover)] border-r-4 border-[var(--color-primary)] pr-3">
            4. التواصل والدعم
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            لأي استفسار بخصوص بياناتك، يمكنك التواصل مع المطور (orcaPROD) عبر البريد:
          </p>
          <div className="py-3 px-6 rounded-xl bg-[var(--color-primary-xsoft)] border border-[var(--color-primary-soft)] inline-block">
            <a href={`mailto:${contactEmail}`} className="text-[var(--color-primary)] font-bold tracking-tight">
              {contactEmail}
            </a>
          </div>
        </section>
      </div>
        <Footer/>
    </div>
  );
}