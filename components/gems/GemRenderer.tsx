import React, { useMemo } from 'react';
import { getGemGeometry, getSidesByLevel, getComplexityByLevel } from '../../lib/gems/GemGeometry';

interface GemRendererProps {
  level: number;
  size?: number; // الحجم بالبكسل
  className?: string;
  showGlow?: boolean; // تفعيل التوهج للمستويات العليا
}

/**
 * GemRenderer - المكون المسؤول عن إخراج الجوهرة بشكلها النهائي الفخم.
 * يدمج الهندسة الرياضية مع التنسيقات البصرية (Gradients & Filters).
 */
const GemRenderer: React.FC<GemRendererProps> = ({ 
  level, 
  size = 100, 
  className = "",
  showGlow = true 
}) => {
  // 1. تحديد الفئة اللونية (Tier) بناءً على رقم المستوى
  const tier = useMemo(() => {
    if (level <= 5) return 1;
    if (level <= 10) return 2;
    if (level <= 25) return 3;
    if (level <= 39) return 4;
    return 5;
  }, [level]);

  // 2. استدعاء الخصائص الهندسية من المحرك الرياضي
  const geometry = useMemo(() => {
    const sides = getSidesByLevel(level);
    const complexity = getComplexityByLevel(level);
    return getGemGeometry(sides, complexity);
  }, [level]);

  // تحديد الفلتر المستخدم (التوهج للمستويات 40+)
  const filterId = (tier === 5 && showGlow) ? "url(#gem-glow)" : "none";

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible"
        style={{ filter: filterId }}
      >
        {/* الطبقة 1: الظل الخارجي الخفيف للعمق */}
        <path
          d={geometry.outerPath}
          fill="black"
          fillOpacity="0.15"
          transform="translate(0, 2)"
        />

        {/* الطبقة 2: الجسم الرئيسي للجوهرة مع التدرج اللوني للفئة */}
        <path
          d={geometry.outerPath}
          fill={`url(#gem-tier-${tier})`}
          filter="url(#gem-inner-shadow)"
          stroke="white"
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />

        {/* الطبقة 3: الشبكة السلكية الداخلية (Wireframe) */}
        {/* نستخدم الـ strokeOpacity لزيادة الفخامة؛ كلما زاد التعقيد تظهر الخطوط برقة */}
        <path
          d={geometry.internalPaths}
          fill="none"
          stroke="white"
          strokeWidth="0.4"
          strokeOpacity={tier >= 4 ? "0.6" : "0.3"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* الطبقة 4: طبقة اللمعان (Shine Effect) */}
        {/* هذه الطبقة هي التي ستتحرك لاحقاً في ملف الـ Motion */}
        <path
          d={geometry.outerPath}
          fill="url(#gem-shine-overlay)"
          pointerEvents="none"
        />
        
        {/* الطبقة 5: حدود خارجية دقيقة جداً لإبراز الشكل (Premium Edge) */}
        <path
          d={geometry.outerPath}
          fill="none"
          stroke={tier >= 4 ? "#FDE68A" : "white"}
          strokeWidth="0.8"
          strokeOpacity="0.2"
        />
      </svg>

      {/* رقم المستوى في منتصف الجوهرة (اختياري حسب رغبتك) */}
      {/* إذا أردت الرقم، يمكن تفعيله هنا بتنسيق Typography فخم */}
    </div>
  );
};

export default GemRenderer;