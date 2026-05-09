"use client";

import React, { useMemo } from 'react';
import GemRenderer from './GemRenderer';
import GemMotion from './GemMotion';
import GemDefinitions from './GemDefinitions';
import { resolveUserLevel } from '@/lib/gems/LevelConfig';

export interface LevelBadgeProps {
  /**
   * عدد المشتركين القادم مباشرة من قاعدة بيانات سوبابيز (total_subscribers).
   * يدعم القيمة null وسيتعامل معها تلقائياً كـ 0 (مستوى 1).
   */
  subscribers: number | null;
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
  withDefinitions?: boolean; 
}

/**
 * LevelBadge - المكون الذكي النهائي.
 * يقرأ عدد المشتركين، يحلل المستوى عبر المحرك الداخلي، ويرسم الجوهرة بأعلى جودة.
 */
const LevelBadge: React.FC<LevelBadgeProps> = ({ 
  subscribers,
  size = 'md', 
  className = "",
  withDefinitions = false 
}) => {
  
  // 1. معالجة البيانات بأمان (Null-Safety & Memoization)
  // حماية المكون من أي أخطاء إذا كانت القيمة القادمة من سوبابيز فارغة
  const safeSubscribers = subscribers ?? 0;
  
  const levelConfig = useMemo(() => {
    return resolveUserLevel(safeSubscribers);
  }, [safeSubscribers]);

  // 2. نظام المقاسات المرن (Responsive Scaling)
  const sizes = {
    sm: { font: 'text-[10px]', gem: 16, gap: 'gap-1', px: 'px-1.5' },
    md: { font: 'text-[12px]', gem: 22, gap: 'gap-1.5', px: 'px-2' },
    lg: { font: 'text-[14px]', gem: 32, gap: 'gap-2', px: 'px-3' },
  };
  const currentSize = sizes[size];

  // 3. التناغم اللوني الذكي (Dynamic Typography)
  const getTextColor = (lvl: number) => {
    if (lvl <= 5) return 'text-slate-300';
    if (lvl <= 10) return 'text-sky-300';
    if (lvl <= 25) return 'text-purple-300';
    if (lvl <= 39) return 'text-yellow-200';
    return 'text-amber-100 font-black drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]';
  };

  return (
    <>
      {/* إدراج تعريفات الـ SVG المعقدة (Gradients & Filters) مرة واحدة عند الطلب */}
      {withDefinitions && <GemDefinitions />}

      <div className={`
        inline-flex items-center justify-center 
        ${currentSize.gap} ${currentSize.px} py-0.5 
        rounded-full border border-white/10 
        bg-black/30 backdrop-blur-md 
        shadow-inner hover:bg-black/40 transition-colors
        ${className}
      `}>
        {/* الطبقة النصية: تعرض الاسم الرسمي للمستوى المستخرج من المحرك */}
        <span className={`
          ${currentSize.font} 
          ${getTextColor(levelConfig.levelNumber)} 
          font-bold tracking-tight select-none
        `}>
          {levelConfig.label}
        </span>

        {/* الطبقة البصرية: تحريك ورسم الجوهرة بناءً على الخصائص الهندسية */}
        <GemMotion level={levelConfig.levelNumber}>
          <GemRenderer 
            level={levelConfig.levelNumber} 
            size={currentSize.gem} 
            showGlow={levelConfig.levelNumber >= 40} 
          />
        </GemMotion>
      </div>
    </>
  );
};

export default LevelBadge;