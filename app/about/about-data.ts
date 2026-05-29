// about-data.ts
// بيانات صفحة التعريف — ZAWAJ AI
// المسار: app/about/about-data.ts

export const APP_INFO = {
  name:        "ZAWAJ AI",
  devTeam:     "ORCAUP",
  version:     "1.0.0",          // استبدل هذا بالقيمة الديناميكية من مشروعك
  category:    "تعارف جاد بهدف الزواج",
  region:      "العالم العربي والجالية المسلمة",
  platform:    "Android",
  contactEmail: "contact@orcaup.com",
  supportEmail: "support@orcaup.com",
  year:        "2025",
};

export interface ValueItem {
  id:      string;
  icon:    string;   // emoji بسيط
  title:   string;
  desc:    string;
}

export interface FeatureItem {
  id:    string;
  icon:  string;
  title: string;
  desc:  string;
}

// ══════════════════════════════════════════
// القيم الجوهرية
// ══════════════════════════════════════════
export const CORE_VALUES: ValueItem[] = [
  {
    id:    "serious",
    icon:  "🤝",
    title: "الجدية",
    desc:  "منصة مخصصة للتعارف الهادف بهدف الزواج، بعيداً عن العلاقات العابرة.",
  },
  {
    id:    "privacy",
    icon:  "🔒",
    title: "الخصوصية",
    desc:  "بياناتك لك وحدك. لا بيع ولا مشاركة مع أي جهة خارجية.",
  },
  {
    id:    "safety",
    icon:  "🛡️",
    title: "الأمان",
    desc:  "تشفير كامل للرسائل، ونظام إشراف يحمي المجتمع من الإساءة.",
  },
  {
    id:    "values",
    icon:  "🌙",
    title: "القيم",
    desc:  "مبني على المعايير المجتمعية العربية والإسلامية المحافظة.",
  },
];

// ══════════════════════════════════════════
// المميزات الرئيسية
// ══════════════════════════════════════════
export const MAIN_FEATURES: FeatureItem[] = [
  {
    id:    "ai",
    icon:  "✨",
    title: "ذكاء اصطناعي",
    desc:  "يراجع البيانات ويحسّن التوافق بين المستخدمين.",
  },
  {
    id:    "mediator",
    icon:  "👥",
    title: "نظام الوساطة",
    desc:  "وسطاء متخصصون يضمنون الجدية ويسهّلون التعارف الناجح.",
  },
  {
    id:    "blur",
    icon:  "👁️",
    title: "التحكم بالصور",
    desc:  "تضبيب الصور اختياري لمزيد من الخصوصية والاحتشام.",
  },
  {
    id:    "points",
    icon:  "🎁",
    title: "نقاط مجانية",
    desc:  "نظام نقاط يُكسب من الإعلانات الاختيارية دون أي دفع إلزامي.",
  },
  {
    id:    "encryption",
    icon:  "🔐",
    title: "تشفير الرسائل",
    desc:  "رسائل مشفرة بالكامل لا يطّلع عليها أحد سواك.",
  },
  {
    id:    "theme",
    icon:  "🎨",
    title: "تجربة مريحة",
    desc:  "وضع ليلي ونهاري وتحكم بحجم الخط لراحة أفضل.",
  },
];