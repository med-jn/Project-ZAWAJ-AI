"use client";

import React from 'react';
import GemRenderer from './GemRenderer';
import GemMotion from './GemMotion';
import GemDefinitions from './GemDefinitions';

// 1. تغيير اسم الـ Interface ليتناسب مع الملف
interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
  withDefinitions?: boolean; 
}

/**
 * LevelBadge - المكون النهائي بالاسم الجديد.
 * يجمع بين 'Lv.X' والجوهرة الهندسيّة بتنسيق يحاكي تيك توك مع لمسة فخامة برمجية.
 */
// 2. تغيير اسم الثابت (Constant) هنا
const LevelBadge: React.FC<LevelBadgeProps> = ({ 
  level, 
  size = 'md', 
  className = "",
  withDefinitions = false 
}) => {
  const sizes = {
    sm: { font: 'text-[10px]', gem: 16, gap: 'gap-1', px: 'px-1.5' },
    md: { font: 'text-[12px]', gem: 22, gap: 'gap-1.5', px: 'px-2' },
    lg: { font: 'text-[14px]', gem: 32, gap: 'gap-2', px: 'px-3' },
  };

  const currentSize = sizes[size];

  const getTextColor = (lvl: number) => {
    if (lvl <= 5) return 'text-slate-300';
    if (lvl <= 10) return 'text-sky-300';
    if (lvl <= 25) return 'text-purple-300';
    if (lvl <= 39) return 'text-yellow-200';
    return 'text-amber-100 font-black drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]';
  };

  return (
    <>
      {withDefinitions && <GemDefinitions />}

      <div className={`
        inline-flex items-center justify-center 
        ${currentSize.gap} ${currentSize.px} py-0.5 
        rounded-full border border-white/10 
        bg-black/30 backdrop-blur-md 
        shadow-inner hover:bg-black/40 transition-colors
        ${className}
      `}>
        <span className={`
          ${currentSize.font} 
          ${getTextColor(level)} 
          font-bold tracking-tight select-none
        `}>
          Lv.{level}
        </span>

        <GemMotion level={level}>
          <GemRenderer 
            level={level} 
            size={currentSize.gem} 
            showGlow={level >= 40} 
          />
        </GemMotion>
      </div>
    </>
  );
};

// 3. تغيير اسم التصدير في السطر الأخير
export default LevelBadge;