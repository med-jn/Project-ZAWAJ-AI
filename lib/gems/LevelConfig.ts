/**
 * LevelConfig - محرك منطق المستويات (النسخة المعمارية النهائية)
 * تم تحسينه للأداء العالي (O(N) Search) وحماية الذاكرة (Immutability).
 */

export interface LevelConfig {
  key: string;
  levelNumber: number;
  label: string;
  minSubscribers: number;
  sides: number;
  complexity: number;
}

// واجهة جديدة لبيانات شريط التقدم (Progress Bar)
export interface LevelProgress {
  currentLevel: LevelConfig;
  nextLevel: LevelConfig | null;
  subscribersNeeded: number;     // كم مشترك ينقص للوصول للمستوى التالي
  progressPercentage: number;    // النسبة المئوية (مثلاً 45.5%)
}

const calculateSides = (level: number): number => {
  if (level <= 5) return 3;
  if (level <= 10) return 4;
  if (level <= 15) return 5;
  if (level <= 20) return 6;
  if (level <= 25) return 7;
  if (level <= 30) return 8;
  if (level <= 39) return 9;
  return 10;
};

const calculateComplexity = (level: number): number => {
  if (level >= 40) return 5;
  return ((level - 1) % 5) + 1;
};

const generateLevelMap = (): Record<string, LevelConfig> => {
  const subThresholds: Record<number, number> = {
    1: 0, 2: 2, 3: 4, 4: 7, 5: 11, 6: 15, 7: 20, 8: 26, 9: 33, 10: 40,
    11: 49, 12: 59, 13: 70, 14: 81, 15: 95, 16: 109, 17: 125, 18: 142, 19: 161, 20: 181,
    21: 203, 22: 227, 23: 252, 24: 279, 25: 308, 26: 339, 27: 372, 28: 407, 29: 444, 30: 483,
    31: 525, 32: 569, 33: 616, 34: 665, 35: 717, 36: 772, 37: 829, 38: 889, 39: 952, 40: 1018,
    41: 1088, 42: 1161, 43: 1238, 44: 1318, 45: 1402, 46: 1490, 47: 1582, 48: 1679, 49: 1780, 50: 2000
  };

  const map: Record<string, LevelConfig> = {};
  for (let i = 1; i <= 50; i++) {
    map[`lv${i}`] = {
      key: `lv${i}`,
      levelNumber: i,
      label: `Lv.${i}`,
      minSubscribers: subThresholds[i],
      sides: calculateSides(i),
      complexity: calculateComplexity(i)
    };
  }
  return map;
};

// 1. تجميد البيانات (Deep Freeze) لمنع التعديل العشوائي في الـ Runtime
export const LEVEL_MAP: Readonly<Record<string, Readonly<LevelConfig>>> = Object.freeze(generateLevelMap());

// 2. الفرز المسبق (Pre-sorting) في الذاكرة لتجنب إعادة الفرز عند كل استدعاء
const SORTED_LEVELS = Object.freeze(
  Object.values(LEVEL_MAP).sort((a, b) => b.levelNumber - a.levelNumber)
);

/**
 * دالة استخراج المستوى (مُحسنة للأداء)
 * تستخدم المصفوفة المفرزة مسبقاً، مما يجعلها خفيفة جداً للعمليات المتكررة.
 */
export const resolveUserLevel = (subCount: number): LevelConfig => {
  return SORTED_LEVELS.find(config => subCount >= config.minSubscribers) || LEVEL_MAP['lv1'];
};

/**
 * 3. دالة جديدة كلياً: حساب التقدم (Progress Calculator)
 * مثالية لإنشاء شريط تقدم (Progress Bar) في صفحة بروفايل المستخدم.
 */
export const calculateUserProgress = (subCount: number): LevelProgress => {
  const currentLevel = resolveUserLevel(subCount);
  
  // إذا وصل للمستوى النهائي (الماكس)
  if (currentLevel.levelNumber === 50) {
    return {
      currentLevel,
      nextLevel: null,
      subscribersNeeded: 0,
      progressPercentage: 100
    };
  }

  const nextLevel = LEVEL_MAP[`lv${currentLevel.levelNumber + 1}`];
  
  // حساب النقاط المطلوبة للقفز للمستوى التالي
  const subscribersNeeded = nextLevel.minSubscribers - subCount;
  
  // حساب المدى الكامل بين المستوى الحالي والتالي لمعرفة النسبة
  const levelRange = nextLevel.minSubscribers - currentLevel.minSubscribers;
  const subscribersInCurrentLevel = subCount - currentLevel.minSubscribers;
  
  // نسبة التقدم مئوية (مقطوعة لرقمين عشريين)
  const progressPercentage = Number(((subscribersInCurrentLevel / levelRange) * 100).toFixed(2));

  return {
    currentLevel,
    nextLevel,
    subscribersNeeded,
    progressPercentage
  };
};