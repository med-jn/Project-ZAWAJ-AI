/**
 * 📜 دستور النظام الاقتصادي للتطبيق — ZAWAJ AI
 * ✅ إصلاح BUG-05: دمج الكائن المكرر في تصريح واحد
 *
 * ملاحظة: هذا الملف مكمّل لـ constants.ts
 * constants.ts  → يحتوي على ECONOMY_SETTINGS (أسماء الجداول، التكاليف، المكافآت)
 * ecomomy.ts    → يحتوي على ECONOMY_RULES (الباقات، أنواع المعاملات)
 */

export const ECONOMY_RULES = {

  // ══════════════════════════════════════
  //  أسعار العمليات (بالنقاط)
  // ══════════════════════════════════════
  PRICES: {
    LIKE:                 7,
    BACK_SWIPE:           3,
    OPEN_CHAT:           20,
    URGENT_CONSULTATION: 50,
    GIFT_MEDIATOR:      100,
  },

  // ══════════════════════════════════════
  //  نظام المكافآت (نقاط مجانية)
  // ══════════════════════════════════════
  REWARDS: {
    WELCOME_BONUS:           100,
    DAILY_LOGIN:              50,
    ACTIVITY_POINT:            1,
    ACTIVITY_INTERVAL_MINS:    5,
  },

  // ══════════════════════════════════════
  //  حدود المحفظة
  // ══════════════════════════════════════
  LIMITS: {
    MAX_FREE_POINTS: 1000,
  },

  // ══════════════════════════════════════
  //  ✅ مُضافة: باقات الشحن في المتجر
  // ══════════════════════════════════════
  PACKAGES: [
    { id: 'pkg_small',  coins: 1000, price_usd:  9.99, label: 'باقة البداية',       is_popular: false },
    { id: 'pkg_medium', coins: 3000, price_usd: 24.99, label: 'الباقة الأكثر طلباً', is_popular: true  },
    { id: 'pkg_large',  coins: 7000, price_usd: 49.99, label: 'باقة النخبة',        is_popular: false },
  ],

  // ══════════════════════════════════════
  //  ✅ مُضافة: أنواع المعاملات
  //  مطابقة لعمود transaction_type في point_transactions
  // ══════════════════════════════════════
  TRANSACTION_TYPES: {
    INCOME:  'deposit',    // شحن، هدية، مكافأة
    EXPENSE: 'withdrawal', // خصم مقابل خدمة
  },

  // ══════════════════════════════════════
  //  أسماء الأفعال (مطابقة لعمود action في likes)
  // ══════════════════════════════════════
  ACTIONS: {
    LIKE:    'like',
    PASS:    'pass',
    BACK:    'back_swipe',
    CHAT:    'open_chat',
    CONSULT: 'urgent_consultation',
  },
};

// ══════════════════════════════════════════
//  Type Helpers
// ══════════════════════════════════════════

export type EconomyAction      = keyof typeof ECONOMY_RULES.PRICES;
export type TransactionType    = typeof ECONOMY_RULES.TRANSACTION_TYPES[keyof typeof ECONOMY_RULES.TRANSACTION_TYPES];
export type EconomyPackage     = typeof ECONOMY_RULES.PACKAGES[number];