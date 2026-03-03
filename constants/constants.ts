/**
 * الدستور المالي والتقني الشامل لتطبيق ZAWAJ AI - نسخة 2026
 */

export const ECONOMY_SETTINGS = {
  CURRENCY: {
    EXCHANGE_RATE: 100,
    SYMBOL: "$",
    MIN_PURCHASE: 500,
    MAX_PURCHASE: 10000,
    STEP: 100,
  },
  DATABASE: {
    TABLE_WALLETS: 'wallets',
    TABLE_TRANSACTIONS: 'point_transactions',
    TABLE_SUBSCRIPTIONS: 'subscriptions',
    COLUMN_PAID: 'balance',
    COLUMN_BONUS: 'balance_free',
    COLUMN_DAILY_CLAIM: 'last_daily_reward', // BUG-02
    WALLET_KEY: 'id',                      // BUG-03
    TRANSACTION_USER_KEY: 'id',            // BUG-04
  },
  REWARDS: {
    WELCOME_BONUS: 100,
    DAILY_LOGIN_BONUS: 30,
    TIME_STAY_POINTS: 1,
    TIME_STAY_INTERVAL: 5,
    MAX_DAILY_TIME_POINTS: 100,
  },
  GENERAL_INTERFACE: {
    SWIPE_RIGHT_COST: 3,
    LIKE_COST: 7,
    MESSAGE_COST: 20,
    FAVORITE_COST: 0,
    CAN_REVERSE_SWIPE: false,
    AUTO_DEDUCT_ON_SWIPE: true,
  },
  MEDIATOR_SPACE: {
    SILVER_TIER: {
      PRICE: 2000,
      FEATURES: {
        UNLIMITED_SWIPES: true,
        FREE_LIKES: 5,
        FREE_CONSULT_LIMIT: 1,
        FREE_CONSULT_COOLDOWN: 72,
        UNBLUR_IMAGES: false,
      }
    },
    GOLD_TIER: {
      PRICE: 5000,
      FEATURES: {
        UNLIMITED_SWIPES: true,
        FREE_LIKES: 10,
        FREE_CONSULT: "UNLIMITED",
        UNBLUR_IMAGES: true,
      }
    },
    SINGLE_SERVICES: {
      URGENT_CONSULTATION: 500,
      GIFT_TO_MEDIATOR: 100,
    }
  },
  UI_LOGIC: {
    BLUR_STYLE: "blur(12px)",
    RESET_HOUR_UTC: 5,
    REQUIRE_CONFIRMATION: true,
    BOTTOM_BUTTONS: ["LIKE", "FAVORITE", "MESSAGE", "MORE_OPTIONS"],
    MORE_OPTIONS_LIST: ["IGNORE", "BLOCK", "REPORT"],
  },
  ALERTS: {
    PAID_ONLY: "هذه الخدمة تتطلب نقاطاً مشتراة فقط. لا يمكن استخدام نقاط المكافآت هنا.",
    LOW_BALANCE: "عذراً، رصيدك غير كافٍ.",
    CONFIRM_ACTION: "سيتم خصم النقاط من محفظتك، هل تريد الاستمرار؟",
  },
  DISCOUNTS: [
    { min: 2000, off: 5 },
    { min: 5000, off: 15 }
  ]
};

// ══════════════════════════════════════════
//  الجنسيات — مرتبطة بقائمة الدول
// ══════════════════════════════════════════

export const NATIONALITIES: Record<string, { male: string; female: string }> = {
  'تونس':     { male: 'تونسي',    female: 'تونسية'    },
  'الجزائر':  { male: 'جزائري',   female: 'جزائرية'   },
  'المغرب':   { male: 'مغربي',    female: 'مغربية'    },
  'ليبيا':    { male: 'ليبي',     female: 'ليبية'     },
  'مصر':      { male: 'مصري',     female: 'مصرية'     },
  'السعودية': { male: 'سعودي',    female: 'سعودية'    },
  'الإمارات': { male: 'إماراتي',  female: 'إماراتية'  },
  'فرنسا':    { male: 'فرنسي',    female: 'فرنسية'    },
  'ألمانيا':  { male: 'ألماني',   female: 'ألمانية'   },
  'كندا':     { male: 'كندي',     female: 'كندية'     },
};

/** استخراج الجنسية حسب الدولة والجنس */
export function getNationality(country: string, gender: 'male' | 'female'): string {
  return NATIONALITIES[country]?.[gender] ?? country;
}

// ══════════════════════════════════════════
//  البيانات الأساسية
// ══════════════════════════════════════════

// education_level → INTEGER في قاعدة البيانات
export const EDUCATION_LEVELS: { id: number; label: string }[] = [
  { id: 21, label: 'ابتدائي'  },
  { id: 22, label: 'متوسط'    },
  { id: 23, label: 'ثانوي'    },
  { id: 24, label: 'جامعي'    },
  { id: 25, label: 'ماجستير'  },
  { id: 26, label: 'دكتوراه'  },
];

/** استخراج نص المستوى التعليمي من الـ ID */
export function getEducationLabel(id: number): string {
  return EDUCATION_LEVELS.find(e => e.id === id)?.label ?? '';
}

// marital_status → INTEGER في قاعدة البيانات
export const MARITAL_STATUS: { id: number; male: string; female: string }[] = [
  { id: 11, male: 'أعزب',  female: 'عزباء'  },
  { id: 12, male: 'مطلق',  female: 'مطلقة'  },
  { id: 13, male: 'أرمل',  female: 'أرملة'  },
];

/** استخراج نص الحالة المدنية من الـ ID والجنس */
export function getMaritalLabel(id: number, gender: 'male' | 'female'): string {
  const s = MARITAL_STATUS.find(m => m.id === id);
  return s ? s[gender] : '';
}

export const MARRIAGE_READINESS: Record<string, string[]> = {
  male:   ['جاهز',  'في ظرف سنة', 'بين سنة وسنتين', 'أكثر من سنتين'],
  female: ['جاهزة', 'في ظرف سنة', 'بين سنة وسنتين', 'أكثر من سنتين'],
};

// housing_type → INTEGER في قاعدة البيانات
export const HOUSING_STATUS: { id: number; label: string }[] = [
  { id: 31, label: 'ملك'          },
  { id: 32, label: 'إيجار'        },
  { id: 33, label: 'مع العائلة'   },
  { id: 34, label: 'سكن وظيفي'   },
];

/** استخراج نص نوع السكن من الـ ID */
export function getHousingLabel(id: number): string {
  return HOUSING_STATUS.find(h => h.id === id)?.label ?? '';
}

export const PREFERRED_HOUSING: string[] = [
  'مستقل', 'مع عائلة الزوج', 'مع عائلة الزوجة', 'مرن',
];

export const EMPLOYMENT_TYPE: string[] = [
  'موظف حكومي', 'موظف قطاع خاص', 'عمل حر',
  'تاجر', 'بدون عمل', 'متقاعد', 'طالب',
];

export const FINANCIAL_STATUS: string[] = [
  'ممتاز', 'جيد', 'متوسط', 'محدود',
];

export const MARRIAGE_TYPE: string[] = [
  'زواج رسمي', 'زواج عرفي', 'زواج سري',
];

export const SKIN_COLOR: string[] = [
  'فاتح', 'قمحي', 'أسمر', 'داكن',
];

export const TRAVEL_WILLINGNESS: string[] = [
  'أقبل الانتقال', 'لا أقبل الانتقال', 'مرن',
];

export const DESIRE_FOR_CHILDREN: string[] = [
  'نعم أريد أطفالاً', 'لا أريد أطفالاً', 'ربما', 'حسب رأي الشريك',
];

// ══════════════════════════════════════════
//  الصحة والعادات
// ══════════════════════════════════════════

export const HEALTH_STATUS_OPTIONS: string[] = [
  'في صحة جيدة',
  'أعاني من مشاكل بسيطة',
  'أعاني من مشاكل مزمنة',
  'أعاني من إعاقة جسدية',
];

export const HEALTH_HABITS: string[] = [
  'رياضي', 'نظام صحي', 'نباتي', 'لا شيء مميز',
];

export const SMOKING: string[] = [
  'غير مدخن', 'مدخن', 'أقلعت عن التدخين',
];

// ══════════════════════════════════════════
//  الدين والالتزام
// ══════════════════════════════════════════

// religious_commitment → INTEGER في قاعدة البيانات
export const RELIGIOUS_COMMITMENT: { id: number; male: string; female: string }[] = [
  { id: 41, male: 'ملتزم',           female: 'ملتزمة'           },
  { id: 42, male: 'ساعٍ للالتزام',   female: 'ساعية للالتزام'   },
  { id: 43, male: 'غير ملتزم',       female: 'غير ملتزمة'       },
];

/** استخراج نص الالتزام الديني من الـ ID والجنس */
export function getReligiousLabel(id: number, gender: 'male' | 'female'): string {
  const r = RELIGIOUS_COMMITMENT.find(r => r.id === id);
  return r ? r[gender] : '';
}

// الحقول التالية تظهر فقط للملتزم أو الساعي للالتزام
// قيمة readiness_level للمستعد الآن — تُستخدم في MatchingEngine
export const READINESS_LEVEL_NOW = 81;

export const COMMITTED_LEVELS: number[] = [41, 42]; // BUG-09: number[] وليس any[]

export const QURAN_MEMORIZATION: string[] = [
  'حافظ للقرآن كاملاً', 'حافظ لأجزاء', 'أتعلم', 'لا',
];

// ── خاص بالذكر الملتزم/الساعي ─────────────
export const BEARD_STYLE: string[] = [
  'ملتحٍ', 'لحية خفيفة', 'غير ملتحٍ',
];

export const PRAYER_COMMITMENT: string[] = [
  'يصلي في المسجد دائماً',
  'يصلي في المسجد غالباً',
  'يصلي في البيت',
  'أحياناً',
];

// ── خاص بالأنثى الملتزمة/الساعية ──────────
export const HIJAB_STYLE: string[] = [
  'منتقبة', 'حجاب شرعي', 'حجاب فضفاض', 'غطاء رأس',
];

export const POLYGAMY_ACCEPTANCE: string[] = [
  'أقبل', 'لا يهمني', 'لا أقبل',
];

export const WORK_AFTER_MARRIAGE: string[] = [
  'نعم أريد العمل', 'لا أريد العمل', 'حسب الاتفاق',
];

// ── خاص بالذكر المتزوج ─────────────────────
export const WIFE_NUMBER: string[] = [
  'الزوجة الأولى', 'الزوجة الثانية', 'الزوجة الثالثة', 'الزوجة الرابعة',
];

// ══════════════════════════════════════════
//  الطبع والشخصية
// ══════════════════════════════════════════

export const SOCIAL_TYPE: string[] = [
  'اجتماعي جداً', 'متوازن', 'انطوائي',
];

export const MORNING_EVENING: string[] = [
  'صباحي', 'مسائي', 'مرن',
];

export const HOME_TIME: string[] = [
  'أحب البيت', 'أحب الخروج', 'متوازن',
];

export const CONFLICT_STYLE: string[] = [
  'أصارح مباشرة', 'أحتاج وقتاً للتفكير', 'أفضل تجنب الخلاف',
];

export const AFFECTION_STYLE: string[] = [
  'معبّر ومحب', 'هادئ ومتحفظ', 'حسب المزاج',
];

export const LIFE_PRIORITY: string[] = [
  'الدين أولاً', 'الأسرة أولاً', 'التوازن بين الجميع', 'العمل والطموح',
];

export const PARENTING_STYLE: string[] = [
  'صارم', 'متساهل', 'متوازن',
];

export const RELATIONSHIP_WITH_FAMILY: string[] = [
  'وثيق جداً', 'متوسط', 'مستقل',
];

// ══════════════════════════════════════════
//  مستويات الوسيط
// ══════════════════════════════════════════

export const MEDIATOR_LEVELS = [
  { min: 0,  name: 'مبتدئ',   badge: '🥉' },
  { min: 10, name: 'فضي',     badge: '🥈' },
  { min: 30, name: 'ذهبي',    badge: '🥇' },
  { min: 60, name: 'بلاتيني', badge: '💎' },
];

export function getMediatorLevel(monthlySubs: number) {
  return [...MEDIATOR_LEVELS].reverse().find(l => monthlySubs >= l.min) || MEDIATOR_LEVELS[0];
}

// ══════════════════════════════════════════
//  نظام البادجات — مرتبط بـ subscription_type
// ══════════════════════════════════════════

/**
 * للمستخدم: يأخذ subscription_type (string)
 * للوسيط:   يأخذ current_monthly_subs (number)
 */
export function getAutoBadgeType(
  value: string | number,
  isBroker: boolean
): 'bronze' | 'silver' | 'gold' | 'diamond' | null {

  if (isBroker) {
    const n = Number(value);
    if (n >= 60) return 'diamond';
    if (n >= 30) return 'gold';
    if (n >= 10) return 'silver';
    if (n >= 1)  return 'bronze';
    return null;
  }

  // المستخدم — حسب الاشتراك الشهري
  const sub = String(value ?? '').toLowerCase();
  if (sub === 'diamond') return 'diamond';
  if (sub === 'gold')    return 'gold';
  if (sub === 'silver')  return 'silver';
  return null;
}