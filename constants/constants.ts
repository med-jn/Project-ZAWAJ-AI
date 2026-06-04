/**
 * ثوابت ZAWAJ AI — 2026
 * التطبيق مجاني بالكامل — نقاط هدايا فقط
 */

export const ECONOMY_SETTINGS = {
  DATABASE: {
    TABLE_WALLETS:     'wallets',
    COLUMN_BONUS:      'balance_free',
    COLUMN_DAILY_CLAIM:'last_daily_reward',
    WALLET_KEY:        'id',
  },
  REWARDS: {
    WELCOME_BONUS:          100,
    DAILY_LOGIN_BONUS:       30,
    TIME_STAY_POINTS:         1,
    TIME_STAY_INTERVAL:       5,
    MAX_DAILY_TIME_POINTS:  100,
  },
  UI_LOGIC: {
    BLUR_STYLE:    'blur(12px)',
    RESET_HOUR_UTC: 5,
  },
  ALERTS: {
    LOW_BALANCE: 'عذراً، رصيدك غير كافٍ.',
  },
};

// ══════════════════════════════════════════
//  الجنسيات
// ══════════════════════════════════════════

export const NATIONALITIES: Record<string, { male: string; female: string }> = {
  'تونس':                  { male: 'تونسي',           female: 'تونسية'           },
  'الجزائر':               { male: 'جزائري',          female: 'جزائرية'          },
  'المغرب':                { male: 'مغربي',           female: 'مغربية'           },
  'ليبيا':                 { male: 'ليبي',            female: 'ليبية'            },
  'موريتانيا':             { male: 'موريتاني',        female: 'موريتانية'        },
  'مصر':                   { male: 'مصري',            female: 'مصرية'            },
  'السودان':               { male: 'سوداني',          female: 'سودانية'          },
  'الصومال':               { male: 'صومالي',          female: 'صومالية'          },
  'جيبوتي':                { male: 'جيبوتي',          female: 'جيبوتية'          },
  'جزر القمر':             { male: 'قمري',            female: 'قمرية'            },
  'السعودية':              { male: 'سعودي',           female: 'سعودية'           },
  'الإمارات':              { male: 'إماراتي',         female: 'إماراتية'         },
  'الكويت':                { male: 'كويتي',           female: 'كويتية'           },
  'قطر':                   { male: 'قطري',            female: 'قطرية'            },
  'البحرين':               { male: 'بحريني',          female: 'بحرينية'          },
  'عُمان':                 { male: 'عُماني',          female: 'عُمانية'          },
  'اليمن':                 { male: 'يمني',            female: 'يمنية'            },
  'الأردن':                { male: 'أردني',           female: 'أردنية'           },
  'فلسطين':                { male: 'فلسطيني',         female: 'فلسطينية'         },
  'سوريا':                 { male: 'سوري',            female: 'سورية'            },
  'لبنان':                 { male: 'لبناني',          female: 'لبنانية'          },
  'العراق':                { male: 'عراقي',           female: 'عراقية'           },
  'فرنسا':                 { male: 'فرنسي',           female: 'فرنسية'           },
  'ألمانيا':               { male: 'ألماني',          female: 'ألمانية'          },
  'بريطانيا':              { male: 'بريطاني',         female: 'بريطانية'         },
  'إيطاليا':               { male: 'إيطالي',          female: 'إيطالية'          },
  'إسبانيا':               { male: 'إسباني',          female: 'إسبانية'          },
  'هولندا':                { male: 'هولندي',          female: 'هولندية'          },
  'بلجيكا':                { male: 'بلجيكي',          female: 'بلجيكية'          },
  'سويسرا':                { male: 'سويسري',          female: 'سويسرية'          },
  'النمسا':                { male: 'نمساوي',          female: 'نمساوية'          },
  'البرتغال':              { male: 'برتغالي',         female: 'برتغالية'         },
  'اليونان':               { male: 'يوناني',          female: 'يونانية'          },
  'السويد':                { male: 'سويدي',           female: 'سويدية'           },
  'الدنمارك':              { male: 'دنماركي',         female: 'دنماركية'         },
  'النرويج':               { male: 'نرويجي',          female: 'نرويجية'          },
  'فنلندا':                { male: 'فنلندي',          female: 'فنلندية'          },
  'بولندا':                { male: 'بولندي',          female: 'بولندية'          },
  'جمهورية التشيك':        { male: 'تشيكي',           female: 'تشيكية'           },
  'رومانيا':               { male: 'روماني',          female: 'رومانية'          },
  'المجر':                 { male: 'مجري',            female: 'مجرية'            },
  'أيرلندا':               { male: 'أيرلندي',         female: 'أيرلندية'         },
  'روسيا':                 { male: 'روسي',            female: 'روسية'            },
  'تركيا':                 { male: 'تركي',            female: 'تركية'            },
  'أوكرانيا':              { male: 'أوكراني',         female: 'أوكرانية'         },
  'كازاخستان':             { male: 'كازاخستاني',      female: 'كازاخستانية'      },
  'أذربيجان':              { male: 'أذربيجاني',       female: 'أذربيجانية'       },
  'جورجيا':                { male: 'جورجي',           female: 'جورجية'           },
  'طاجيكستان':             { male: 'طاجيكستاني',      female: 'طاجيكستانية'      },
  'قيرغيزستان':            { male: 'قيرغيزي',         female: 'قيرغيزية'         },
  'تركمانستان':            { male: 'تركماني',         female: 'تركمانية'         },
  'أوزبكستان':             { male: 'أوزبكي',          female: 'أوزبكية'          },
  'الولايات المتحدة':      { male: 'أمريكي',          female: 'أمريكية'          },
  'كندا':                  { male: 'كندي',            female: 'كندية'            },
  'المكسيك':               { male: 'مكسيكي',          female: 'مكسيكية'          },
  'البرازيل':              { male: 'برازيلي',         female: 'برازيلية'         },
  'الأرجنتين':             { male: 'أرجنتيني',        female: 'أرجنتينية'        },
  'كولومبيا':              { male: 'كولومبي',         female: 'كولومبية'         },
  'تشيلي':                 { male: 'تشيلي',           female: 'تشيلية'           },
  'بيرو':                  { male: 'بيروفي',          female: 'بيروفية'          },
  'فنزويلا':               { male: 'فنزويلي',         female: 'فنزويلية'         },
  'أستراليا':              { male: 'أسترالي',         female: 'أسترالية'         },
  'نيوزيلندا':             { male: 'نيوزيلندي',       female: 'نيوزيلندية'       },
  'باكستان':               { male: 'باكستاني',        female: 'باكستانية'        },
  'الهند':                 { male: 'هندي',            female: 'هندية'            },
  'بنغلاديش':              { male: 'بنغلاديشي',       female: 'بنغلاديشية'       },
  'ماليزيا':               { male: 'ماليزي',          female: 'ماليزية'          },
  'إندونيسيا':             { male: 'إندونيسي',        female: 'إندونيسية'        },
  'الفلبين':               { male: 'فلبيني',          female: 'فلبينية'          },
  'سنغافورة':              { male: 'سنغافوري',        female: 'سنغافورية'        },
  'تايلاند':               { male: 'تايلاندي',        female: 'تايلاندية'        },
  'اليابان':               { male: 'ياباني',          female: 'يابانية'          },
  'كوريا الجنوبية':        { male: 'كوري',            female: 'كورية'            },
  'الصين':                 { male: 'صيني',            female: 'صينية'            },
  'هونغ كونغ':             { male: 'من هونغ كونغ',    female: 'من هونغ كونغ'    },
  'تايوان':                { male: 'تايواني',         female: 'تايوانية'         },
  'فيتنام':                { male: 'فيتنامي',         female: 'فيتنامية'         },
  'كمبوديا':               { male: 'كمبودي',          female: 'كمبودية'          },
  'ميانمار':               { male: 'ميانماري',        female: 'ميانمارية'        },
  'سريلانكا':              { male: 'سريلانكي',        female: 'سريلانكية'        },
  'نيبال':                 { male: 'نيبالي',          female: 'نيبالية'          },
  'إيران':                 { male: 'إيراني',          female: 'إيرانية'          },
  'أفغانستان':             { male: 'أفغاني',          female: 'أفغانية'          },
  'نيجيريا':               { male: 'نيجيري',          female: 'نيجيرية'          },
  'غانا':                  { male: 'غاني',            female: 'غانية'            },
  'السنغال':               { male: 'سنغالي',          female: 'سنغالية'          },
  'ساحل العاج':            { male: 'من ساحل العاج',   female: 'من ساحل العاج'   },
  'الكاميرون':             { male: 'كاميروني',        female: 'كاميرونية'        },
  'إثيوبيا':               { male: 'إثيوبي',          female: 'إثيوبية'          },
  'كينيا':                 { male: 'كيني',            female: 'كينية'            },
  'تنزانيا':               { male: 'تنزاني',          female: 'تنزانية'          },
  'أوغندا':                { male: 'أوغندي',          female: 'أوغندية'          },
  'رواندا':                { male: 'رواندي',          female: 'رواندية'          },
  'موزمبيق':               { male: 'موزمبيقي',        female: 'موزمبيقية'        },
  'زيمبابوي':              { male: 'زيمبابوي',        female: 'زيمبابوية'        },
  'زامبيا':                { male: 'زامبي',           female: 'زامبية'           },
  'جنوب أفريقيا':          { male: 'جنوب أفريقي',     female: 'جنوب أفريقية'     },
  'مدغشقر':                { male: 'مدغشقري',         female: 'مدغشقرية'         },
  'مالي':                  { male: 'مالي',            female: 'مالية'            },
  'بوركينا فاسو':          { male: 'بوركيني',         female: 'بوركينية'         },
  'النيجر':                { male: 'نيجري',           female: 'نيجرية'           },
  'تشاد':                  { male: 'تشادي',           female: 'تشادية'           },
  'الكونغو':               { male: 'كونغولي',         female: 'كونغولية'         },
  'إسرائيل':               { male: 'إسرائيلي',        female: 'إسرائيلية'        },
  'قبرص':                  { male: 'قبرصي',           female: 'قبرصية'           },
  'مالطا':                 { male: 'مالطي',           female: 'مالطية'           },
  'أيسلندا':               { male: 'أيسلندي',         female: 'أيسلندية'         },
  'لوكسمبورغ':             { male: 'لوكسمبورغي',      female: 'لوكسمبورغية'      },
  'سلوفينيا':              { male: 'سلوفيني',         female: 'سلوفينية'         },
  'كرواتيا':               { male: 'كرواتي',          female: 'كرواتية'          },
  'صربيا':                 { male: 'صربي',            female: 'صربية'            },
  'البوسنة والهرسك':       { male: 'بوسني',           female: 'بوسنية'           },
  'ألبانيا':               { male: 'ألباني',          female: 'ألبانية'          },
  'مقدونيا الشمالية':      { male: 'مقدوني',          female: 'مقدونية'          },
  'الجبل الأسود':          { male: 'جبلي أسود',       female: 'جبلية أسود'       },
  'سلوفاكيا':              { male: 'سلوفاكي',         female: 'سلوفاكية'         },
  'بلغاريا':               { male: 'بلغاري',          female: 'بلغارية'          },
  'إستونيا':               { male: 'إستوني',          female: 'إستونية'          },
  'لاتفيا':                { male: 'لاتفي',           female: 'لاتفية'           },
  'ليتوانيا':              { male: 'ليتواني',         female: 'ليتوانية'         },
  'بيلاروسيا':             { male: 'بيلاروسي',        female: 'بيلاروسية'        },
  'مولدوفا':               { male: 'مولدوفي',         female: 'مولدوفية'         },
  'التشيك':                { male: 'تشيكي',           female: 'تشيكية'           },
  'إكوادور':               { male: 'إكوادوري',        female: 'إكوادورية'        },
  'بوليفيا':               { male: 'بوليفي',          female: 'بوليفية'          },
  'باراغواي':              { male: 'باراغواياني',      female: 'باراغوايانية'     },
  'أوروغواي':              { male: 'أوروغواياني',      female: 'أوروغوايانية'     },
  'غينيا':                 { male: 'غيني',            female: 'غينية'            },
  'كوت ديفوار':            { male: 'إيفواري',         female: 'إيفوارية'         },
};

export function getNationality(country: string, gender: 'male' | 'female'): string {
  return NATIONALITIES[country]?.[gender] ?? country;
}

// ══════════════════════════════════════════
//  البيانات الأساسية
// ══════════════════════════════════════════

export const EDUCATION_LEVELS: { id: number; label: string }[] = [
  { id: 21, label: 'ابتدائي'  },
  { id: 22, label: 'متوسط'    },
  { id: 23, label: 'ثانوي'    },
  { id: 24, label: 'جامعي'    },
  { id: 25, label: 'ماجستير'  },
  { id: 26, label: 'دكتوراه'  },
];

export function getEducationLabel(id: number): string {
  return EDUCATION_LEVELS.find(e => e.id === id)?.label ?? '';
}

export const MARITAL_STATUS: { id: number; male: string; female: string }[] = [
  { id: 11, male: 'أعزب',  female: 'عزباء'  },
  { id: 12, male: 'مطلق',  female: 'مطلقة'  },
  { id: 13, male: 'أرمل',  female: 'أرملة'  },
];

export function getMaritalLabel(id: number, gender: 'male' | 'female'): string {
  const s = MARITAL_STATUS.find(m => m.id === id);
  return s ? s[gender] : '';
}

export const MARRIAGE_READINESS: { id: number; male: string; female: string }[] = [
  { id: 51, male: 'جاهز',            female: 'جاهزة'           },
  { id: 52, male: 'في ظرف سنة',      female: 'في ظرف سنة'      },
  { id: 53, male: 'بين سنة وسنتين',  female: 'بين سنة وسنتين'  },
  { id: 54, male: 'أكثر من سنتين',   female: 'أكثر من سنتين'   },
];

export function getReadinessLabel(id: number, gender: 'male' | 'female'): string {
  return MARRIAGE_READINESS.find(r => r.id === id)?.[gender] ?? '';
}

export const HOUSING_STATUS: { id: number; label: string }[] = [
  { id: 31, label: 'ملك'          },
  { id: 32, label: 'إيجار'        },
  { id: 33, label: 'مع العائلة'   },
  { id: 34, label: 'سكن وظيفي'   },
];

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

export const RELIGIOUS_COMMITMENT: { id: number; male: string; female: string }[] = [
  { id: 41, male: 'ملتزم',           female: 'ملتزمة'           },
  { id: 42, male: 'ساعٍ للالتزام',   female: 'ساعية للالتزام'   },
  { id: 43, male: 'غير ملتزم',       female: 'غير ملتزمة'       },
];

export function getReligiousLabel(id: number, gender: 'male' | 'female'): string {
  const r = RELIGIOUS_COMMITMENT.find(r => r.id === id);
  return r ? r[gender] : '';
}

export const READINESS_LEVEL_NOW = 81;
export const COMMITTED_LEVELS: number[] = [41, 42];

export const QURAN_MEMORIZATION: string[] = [
  'حافظ للقرآن كاملاً', 'حافظ لأجزاء', 'أتعلم', 'لا',
];

export const BEARD_STYLE: string[] = [
  'ملتحٍ', 'لحية خفيفة', 'غير ملتحٍ',
];

export const PRAYER_COMMITMENT: string[] = [
  'يصلي في المسجد دائماً',
  'يصلي في المسجد غالباً',
  'يصلي في البيت',
  'أحياناً',
];

export const HIJAB_STYLE: string[] = [
  'منتقبة', 'حجاب شرعي', 'حجاب فضفاض', 'غطاء رأس',
];

export const POLYGAMY_ACCEPTANCE: string[] = [
  'أقبل', 'لا يهمني', 'لا أقبل',
];

export const WORK_AFTER_MARRIAGE: string[] = [
  'نعم أريد العمل', 'لا أريد العمل', 'حسب الاتفاق',
];

export const WIFE_NUMBER: string[] = [
  'الزوجة الأولى', 'الزوجة الثانية', 'الزوجة الثالثة', 'الزوجة الرابعة',
];

// ══════════════════════════════════════════
//  الطبع والشخصية
// ══════════════════════════════════════════

export const SOCIAL_TYPE: string[]      = [ 'اجتماعي جداً', 'متوازن', 'انطوائي' ];
export const MORNING_EVENING: string[]  = [ 'صباحي', 'مسائي', 'مرن' ];
export const HOME_TIME: string[]        = [ 'أحب البيت', 'أحب الخروج', 'متوازن' ];
export const CONFLICT_STYLE: string[]   = [ 'أصارح مباشرة', 'أحتاج وقتاً للتفكير', 'أفضل تجنب الخلاف' ];
export const AFFECTION_STYLE: string[]  = [ 'معبّر ومحب', 'هادئ ومتحفظ', 'حسب المزاج' ];
export const LIFE_PRIORITY: string[]    = [ 'الدين أولاً', 'الأسرة أولاً', 'التوازن بين الجميع', 'العمل والطموح' ];
export const PARENTING_STYLE: string[]  = [ 'صارم', 'متساهل', 'متوازن' ];
export const RELATIONSHIP_WITH_FAMILY: string[] = [ 'وثيق جداً', 'متوسط', 'مستقل' ];
