/**
 * Gems System Index
 * هذا الملف هو البوابة المركزية لجميع مكونات نظام الجواهر والمستويات.
 * يتيح لك استدعاء المكونات بأسلوب نظيف: import { LevelBadge } from '@/components/gems';
 */

// 1. تصدير المكونات البصرية (UI Components)
export { default as LevelBadge } from './LevelBadge';
export { default as GemDefinitions } from './GemDefinitions';

// 2. تصدير الأنواع (Types) للاستخدام في TypeScript
export type { LevelBadgeProps } from './LevelBadge';

// 3. تصدير المحرك المنطقي (Logic & Config) 
// هذا يسمح لك باستخدام دوال الحساب في أي مكان في التطبيق
export { 
  LEVEL_MAP, 
  resolveUserLevel, 
  calculateUserProgress 
} from '../../lib/gems/LevelConfig';

export type { 
  LevelConfig, 
  LevelProgress 
} from '../../lib/gems/LevelConfig';

/**
 * نصيحة "بريميوم":
 * للاستخدام الأمثل، ضع <GemDefinitions /> في ملف (layout.tsx) الرئيسي،
 * ثم استعن بـ <LevelBadge /> في أي واجهة فرعية.
 */