/**
 * 📜 دستور النظام الاقتصادي — ZAWAJ AI  v2.1
 * ✅ 3 باقات ثابتة (1000 / 2000 / 3000 نقطة)
 * ✅ شراء حر (500 – 10 000 نقطة، قفزة 100)
 * ✅ سعر الوحدة مشتقّ تلقائياً من pkg_s (لا جداول إضافية)
 * ✅ العملة مفروضة من profiles.country — لا اختيار يدوي
 */

export const ECONOMY_RULES = {

  PRICES: {
    LIKE:                  7,
    BACK_SWIPE:            3,
    OPEN_CHAT:            20,
    URGENT_CONSULTATION:  50,
    GIFT_MEDIATOR:       100,
  },

  REWARDS: {
    WELCOME_BONUS:          100,
    DAILY_LOGIN:             50,
    ACTIVITY_POINT:           1,
    ACTIVITY_INTERVAL_MINS:   5,
  },

  LIMITS: {
    MAX_FREE_POINTS: 1000,
  },

  // ══════════════════════════════════════
  //  الباقات الثابتة الثلاث
  // ══════════════════════════════════════
  PACKAGES: [
    { id: 'pkg_s', coins: 1000, label: 'باقة البداية',        is_popular: false },
    { id: 'pkg_m', coins: 2000, label: 'الباقة الأكثر طلباً', is_popular: true  },
    { id: 'pkg_l', coins: 3000, label: 'باقة النخبة',         is_popular: false },
  ],

  // ══════════════════════════════════════
  //  حدود الشراء الحر
  // ══════════════════════════════════════
  CUSTOM_RANGE: {
    MIN:  500,
    MAX:  10_000,
    STEP: 100,
  },

  // ══════════════════════════════════════
  //  أسعار الباقات لكل عملة
  //  pkg_s = سعر 1000 نقطة → هو أساس حساب الشراء الحر
  //  pkg_m / pkg_l فيهما خصم ضمني للتشجيع
  // ══════════════════════════════════════
  CURRENCY_PRICING: {
    TND: {
      symbol: 'د.ت', name: 'دينار تونسي',
      packages: { pkg_s: 29.990, pkg_m: 54.990, pkg_l: 74.990 },
    },
    SAR: {
      symbol: 'ر.س', name: 'ريال سعودي',
      packages: { pkg_s: 37.00, pkg_m: 68.00, pkg_l: 93.00 },
    },
    AED: {
      symbol: 'د.إ', name: 'درهم إماراتي',
      packages: { pkg_s: 37.00, pkg_m: 67.00, pkg_l: 92.00 },
    },
    QAR: {
      symbol: 'ر.ق', name: 'ريال قطري',
      packages: { pkg_s: 36.00, pkg_m: 66.00, pkg_l: 90.00 },
    },
    KWD: {
      symbol: 'د.ك', name: 'دينار كويتي',
      packages: { pkg_s: 3.100, pkg_m: 5.700, pkg_l: 7.750 },
    },
    BHD: {
      symbol: 'د.ب', name: 'دينار بحريني',
      packages: { pkg_s: 3.800, pkg_m: 7.000, pkg_l: 9.500 },
    },
    OMR: {
      symbol: 'ر.ع', name: 'ريال عُماني',
      packages: { pkg_s: 3.900, pkg_m: 7.200, pkg_l: 9.750 },
    },
    MAD: {
      symbol: 'د.م', name: 'درهم مغربي',
      packages: { pkg_s: 89.00, pkg_m: 165.00, pkg_l: 225.00 },
    },
    DZD: {
      symbol: 'د.ج', name: 'دينار جزائري',
      packages: { pkg_s: 990, pkg_m: 1850, pkg_l: 2490 },
    },
    LYD: {
      symbol: 'ل.د', name: 'دينار ليبي',
      packages: { pkg_s: 42.00, pkg_m: 78.00, pkg_l: 105.00 },
    },
    EGP: {
      symbol: 'ج.م', name: 'جنيه مصري',
      packages: { pkg_s: 299, pkg_m: 549, pkg_l: 749 },
    },
    JOD: {
      symbol: 'د.أ', name: 'دينار أردني',
      packages: { pkg_s: 6.990, pkg_m: 12.990, pkg_l: 17.500 },
    },
    IQD: {
      symbol: 'د.ع', name: 'دينار عراقي',
      packages: { pkg_s: 11_000, pkg_m: 20_500, pkg_l: 27_500 },
    },
    USD: {
      symbol: '$', name: 'دولار أمريكي',
      packages: { pkg_s: 9.99, pkg_m: 18.99, pkg_l: 24.99 },
    },
    EUR: {
      symbol: '€', name: 'يورو',
      packages: { pkg_s: 9.99, pkg_m: 18.99, pkg_l: 24.99 },
    },
  } as const,

  TND_RATES: {
    TND: 1.000, SAR: 0.826, AED: 0.844, QAR: 0.851,
    KWD: 10.09, BHD: 8.22,  OMR: 8.05,
    MAD: 0.310, DZD: 0.023, LYD: 0.644,
    EGP: 0.062, JOD: 4.37,  IQD: 0.0024,
    USD: 3.10,  EUR: 3.30,
  } as const,

  COUNTRY_CURRENCY: {
    TN: 'TND', SA: 'SAR', AE: 'AED', EG: 'EGP',
    MA: 'MAD', JO: 'JOD', KW: 'KWD', QA: 'QAR',
    BH: 'BHD', OM: 'OMR', DZ: 'DZD', LY: 'LYD',
    IQ: 'IQD', SY: 'USD', LB: 'USD', YE: 'USD',
    SD: 'USD', MR: 'USD',
  } as const,

  TRANSACTION_SOURCES: {
    KONNECT:     'konnect',
    ADMOB:       'admob',
    DAILY_BONUS: 'daily_bonus',
    WELCOME:     'welcome',
    ACTION:      'action',
    ADMIN:       'admin',
  },

  ACTIONS: {
    LIKE:    'like',
    PASS:    'pass',
    BACK:    'back_swipe',
    CHAT:    'open_chat',
    CONSULT: 'urgent_consultation',
    GIFT:    'gift_to_mediator',
  },

} as const;

// ══════════════════════════════════════════
//  Types
// ══════════════════════════════════════════
export type SupportedCurrency = keyof typeof ECONOMY_RULES.CURRENCY_PRICING;
export type SupportedCountry  = keyof typeof ECONOMY_RULES.COUNTRY_CURRENCY;
export type PackageId         = 'pkg_s' | 'pkg_m' | 'pkg_l';
export type TransactionSource = typeof ECONOMY_RULES.TRANSACTION_SOURCES[keyof typeof ECONOMY_RULES.TRANSACTION_SOURCES];
export type EconomyAction     = keyof typeof ECONOMY_RULES.PRICES;

// ── نوع موحّد لأي عملية شراء (ثابتة أو حرة) ──────────────────
export type PurchasePayload =
  | { type: 'package'; packageId: PackageId }
  | { type: 'custom';  coins: number };

// ══════════════════════════════════════════
//  دوال مساعدة
// ══════════════════════════════════════════

export function getCurrencyByCountry(countryCode: string): SupportedCurrency {
  return (ECONOMY_RULES.COUNTRY_CURRENCY as Record<string, SupportedCurrency>)[countryCode] ?? 'USD';
}

export function getPackagePrice(packageId: PackageId, currency: SupportedCurrency): number {
  return ECONOMY_RULES.CURRENCY_PRICING[currency].packages[packageId];
}

/**
 * سعر الشراء الحر
 * (coins / 1000) × سعر pkg_s
 * مثال TND: 1500 نقطة = 1.5 × 29.990 = 44.985 د.ت
 */
export function getCustomPrice(coins: number, currency: SupportedCurrency): number {
  const basePrice = ECONOMY_RULES.CURRENCY_PRICING[currency].packages.pkg_s;
  return parseFloat(((coins / 1000) * basePrice).toFixed(3));
}

/** أي مبلغ → TND */
export function toTND(amount: number, currency: SupportedCurrency): number {
  return parseFloat((amount * ECONOMY_RULES.TND_RATES[currency]).toFixed(3));
}

/** TND → مليمات لـ Konnect */
export function toMillimes(tndAmount: number): number {
  return Math.round(tndAmount * 1000);
}

/** عدد المنازل العشرية المناسب لعرض السعر */
export function priceDecimals(price: number): number {
  if (price >= 1000) return 0;
  if (price >= 100)  return 0;
  if (price >= 10)   return 2;
  return 3;
}