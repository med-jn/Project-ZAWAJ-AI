'use client';
import { FileText, Shield, User, AlertCircle } from 'lucide-react';

const SECTIONS = [
  {
    icon: User,
    title: 'شروط الاستخدام',
    content: `باستخدامك لتطبيق ZAWAJ AI فإنك توافق على الشروط التالية:

• يجب أن يكون عمرك 18 سنة أو أكثر.
• تلتزم بتقديم معلومات صحيحة ودقيقة في ملفك الشخصي.
• يُحظر استخدام التطبيق لأغراض غير مشروعة أو مخالفة للآداب العامة.
• يُحظر انتحال شخصية أي شخص آخر.
• تلتزم باحترام المستخدمين الآخرين وعدم التحرش أو الإساءة.
• نحتفظ بالحق في تعليق أو حذف أي حساب يخالف هذه الشروط.`,
  },
  {
    icon: Shield,
    title: 'سياسة الخصوصية',
    content: `نحن نأخذ خصوصيتك على محمل الجد:

• نجمع فقط البيانات الضرورية لتشغيل الخدمة.
• لا نبيع بياناتك أو نشاركها مع أطراف ثالثة لأغراض تجارية.
• جميع البيانات مشفرة ومحمية بأعلى معايير الأمان.
• يحق لك طلب حذف جميع بياناتك في أي وقت.
• نستخدم Supabase كمزود خدمة قاعدة البيانات الذي يلتزم بمعايير GDPR.
• قد نستخدم بيانات مجهولة الهوية لتحسين الخدمة.`,
  },
  {
    icon: FileText,
    title: 'سياسة الاسترداد',
    content: `بخصوص النقاط والمدفوعات:

• النقاط المشتراة غير قابلة للاسترداد بعد إتمام عملية الشراء.
• في حال وجود خطأ تقني من جهتنا، نلتزم باسترداد المبلغ كاملاً.
• يمكن نقل النقاط كهدايا لمستخدمين آخرين.
• تنتهي صلاحية النقاط حسب الباقة المختارة.`,
  },
  {
    icon: AlertCircle,
    title: 'إخلاء المسؤولية',
    content: `يُقدم ZAWAJ AI منصة للتعارف بهدف الزواج فقط:

• لسنا مسؤولين عن القرارات الشخصية التي يتخذها المستخدمون.
• لا نضمن نتائج معينة من استخدام التطبيق.
• نوصي بالتحقق من هوية أي شخص قبل اللقاء الشخصي.
• الوسطاء مستقلون وليسوا موظفين لدينا.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-full px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-black text-white mb-2">الشروط والسياسات</h1>
      <p className="text-white/40 text-sm mb-6">آخر تحديث: يناير 2026</p>

      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="glass-panel p-5">
            <h2 className="text-white font-black text-sm border-b border-white/10 pb-3 flex items-center gap-2 mb-4">
              <section.icon size={16} className="text-[#c0002a]" />
              {section.title}
            </h2>
            <p className="text-white/55 text-sm leading-relaxed whitespace-pre-line">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      <p className="text-white/20 text-[10px] text-center mt-6 pb-4">
        ZAWAJ AI © 2026 — جميع الحقوق محفوظة
      </p>
    </div>
  );
}