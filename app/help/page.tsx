'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Mail } from 'lucide-react';

const FAQS = [
  {
    q: 'كيف تعمل النقاط؟',
    a: 'النقاط هي عملة التطبيق. تحصل على 100 نقطة مجانية عند التسجيل، و30 نقطة يومياً. كل إعجاب يكلف 7 نقاط وكل رسالة 20 نقطة.',
  },
  {
    q: 'ما الفرق بين النقاط المشتراة ونقاط المكافآت؟',
    a: 'النقاط المشتراة تُستخدم لجميع الخدمات بما فيها خدمات الوسطاء. نقاط المكافآت مجانية لكنها لا تُستخدم في خدمات الوسطاء.',
  },
  {
    q: 'كيف يعمل نظام الوسيط؟',
    a: 'الوسيط شخص موثوق يتولى مساعدتك في عملية التعارف. يمكنك الاشتراك عنده بالباقة الفضية (2000 نقطة) أو الذهبية (5000 نقطة).',
  },
  {
    q: 'كيف أحمي صوري؟',
    a: 'من الإعدادات يمكنك تفعيل خاصية تضبيب الصور. لن يرى أحد صورك بوضوح إلا من اشترك في باقة الوسيط الذهبية أو من أذنت له.',
  },
  {
    q: 'هل بياناتي آمنة؟',
    a: 'نعم. نستخدم Supabase مع تشفير كامل. لا تُشارك بياناتك مع أي طرف ثالث أبداً.',
  },
  {
    q: 'كيف أحذف حسابي؟',
    a: 'من قائمة الإعدادات ← الأمان والخصوصية ← حذف الحساب. التحذير: هذا الإجراء لا يمكن التراجع عنه.',
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-full px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-black text-white mb-2">المساعدة والدعم</h1>
      <p className="text-white/40 text-sm mb-6">الأسئلة الشائعة والتواصل معنا</p>

      {/* الأسئلة الشائعة */}
      <div className="space-y-3 mb-8">
        {FAQS.map((faq, i) => (
          <div key={i} className="glass-panel overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-right"
            >
              <span className="text-white font-bold text-sm flex-1">{faq.q}</span>
              {openIndex === i
                ? <ChevronUp size={18} className="text-[#c0002a] flex-shrink-0 mr-2" />
                : <ChevronDown size={18} className="text-white/30 flex-shrink-0 mr-2" />
              }
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4 border-t border-white/10">
                <p className="text-white/60 text-sm leading-relaxed pt-3">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* التواصل */}
      <div className="glass-panel p-5 space-y-3">
        <h2 className="text-white font-black text-sm border-b border-white/10 pb-3">تواصل معنا</h2>
        <a
          href="mailto:support@zawaj-ai.com"
          className="flex items-center gap-4 py-3 hover:bg-white/5 rounded-2xl px-2 transition-all"
        >
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(192,0,42,0.12)', border: '1px solid rgba(192,0,42,0.2)' }}>
            <Mail size={17} className="text-[#c0002a]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">البريد الإلكتروني</p>
            <p className="text-white/40 text-xs">support@zawaj-ai.com</p>
          </div>
        </a>
        <a
          href="https://wa.me/21600000000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 py-3 hover:bg-white/5 rounded-2xl px-2 transition-all"
        >
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(192,0,42,0.12)', border: '1px solid rgba(192,0,42,0.2)' }}>
            <MessageCircle size={17} className="text-[#c0002a]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">واتساب</p>
            <p className="text-white/40 text-xs">متاح من 9 صباحاً حتى 9 مساءً</p>
          </div>
        </a>
      </div>
    </div>
  );
}