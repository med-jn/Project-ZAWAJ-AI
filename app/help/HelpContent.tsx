'use client';
import { Brand } from '@/components/ui/brand';
import Footer from '@/components/layout/Footer';

export default function HelpContent() {
  const supportEmail = "contact.orcaprod@gmail.com";

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 pb-20 font-cairo selection:bg-[var(--color-primary)]/30" dir="rtl">
      {/* Header - موحد مع بقية الوثائق */}
      <div className="flex flex-col items-center mb-16 gap-4 border-b border-[var(--glass-border)] pb-10 text-center">
        <div className="scale-60 origin-center -mb-4"><Brand /></div>
        <h1 className="text-3xl font-black text-[var(--color-primary)] uppercase">المساعدة والدعم</h1>
        <p className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase opacity-40">Help & Support</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-16 leading-relaxed text-right">
        
        {/* 1. نظام النقاط والاشتراكات */}
        <section className="relative pr-6 border-r-2 border-[var(--color-primary)]/20">
          <div className="flex justify-between items-baseline mb-4 gap-4">
            <h2 className="text-xl font-bold text-[var(--color-gold-hover)]">1. نظام النقاط (Credits)</h2>
            <span className="text-[10px] font-sans opacity-30 uppercase font-bold tracking-widest">Economy & Billing</span>
          </div>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>تُستخدم النقاط داخل تطبيق ZAWAJ AI لفتح المحادثات وإرسال الإعجابات المميزة. يمكنك الحصول عليها عبر الشراء المباشر أو من خلال مشاهدة الإعلانات المكافئة.</p>
            <p className="text-[12px] italic opacity-60 font-sans" dir="ltr">
              Credits are used to unlock chats and send premium likes. You can earn them via direct purchase or rewarded ads.
            </p>
          </div>
        </section>

        {/* 2. دور الوسطاء (Mediators) */}
        <section className="relative pr-6 border-r-2 border-[var(--color-primary)]/20">
          <div className="flex justify-between items-baseline mb-4 gap-4">
            <h2 className="text-xl font-bold text-[var(--color-gold-hover)]">2. الوسطاء والخصوصية</h2>
            <span className="text-[10px] font-sans opacity-30 uppercase font-bold tracking-widest">Human Mediation</span>
          </div>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>الوسطاء هم أشخاص حقيقيون معتمدون من إدارة orcaPROD، مهمتهم مراجعة الملفات وتسهيل التواصل بين الطرفين لضمان الجدية التامة وحل النزاعات التقنية.</p>
            <p className="text-[12px] italic opacity-60 font-sans" dir="ltr">
              Verified mediators facilitate matching and ensure serious intent, operating under strict orcaPROD privacy standards.
            </p>
          </div>
        </section>

        {/* 3. الذكاء الاصطناعي والأمان */}
        <section className="relative pr-6 border-r-2 border-[var(--color-primary)]/20">
          <div className="flex justify-between items-baseline mb-4 gap-4">
            <h2 className="text-xl font-bold text-[var(--color-gold-hover)]">3. الدعم الفني والذكاء الاصطناعي</h2>
            <span className="text-[10px] font-sans opacity-30 uppercase font-bold tracking-widest">AI & Tech Support</span>
          </div>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>يعمل محرك Gemini AI على تحليل بلاغات المستخدمين واكتشاف الحسابات الوهمية تلقائياً. في حال واجهت مشكلة تقنية في التسجيل أو الدفع، يرجى التواصل معنا فوراً.</p>
            <p className="text-[12px] italic opacity-60 font-sans" dir="ltr">
              Gemini AI monitors reports and fake accounts. For technical issues with registration or billing, please contact us immediately.
            </p>
          </div>
        </section>

        {/* 4. قنوات التواصل الرسمية */}
        <section className="mt-12 p-10 rounded-[2rem] bg-gradient-to-b from-[var(--color-primary)]/5 to-transparent border border-[var(--glass-border)] text-center">
          <h2 className="text-xl font-bold mb-4">هل تحتاج لمساعدة فورية؟</h2>
          <p className="text-sm opacity-70 mb-8">نحن في <span className="font-bold text-[var(--color-primary)] uppercase">orcaPROD</span> نلتزم بالرد على استفساراتكم خلال 24 ساعة.</p>
          <div className="inline-flex flex-col gap-4">
            <a href={`mailto:${supportEmail}`} className="px-10 py-4 rounded-xl bg-[var(--color-primary)] text-white font-sans font-black tracking-wider text-sm hover:scale-105 transition-transform">
              {supportEmail}
            </a>
            <p className="text-[10px] font-sans opacity-40 uppercase tracking-tighter text-center">Direct Developer Support</p>
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}