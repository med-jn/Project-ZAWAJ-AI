import React from 'react';

/**
 * GemDefinitions - المكون المسؤول عن تعريف الهوية البصرية للجواهر.
 * يتم استدعاؤه مرة واحدة في جذر ملف البادجات ليوفر التدرجات والفلاتر لكل الجواهر.
 */
const GemDefinitions: React.FC = () => {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {/* 1. تدرج الفئة الأولى (1-5): الفضي/الرمادي الكريستالي */}
        <linearGradient id="gem-tier-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* 2. تدرج الفئة الثانية (6-10): الأزرق السماوي */}
        <radialGradient id="gem-tier-2" cx="50%" cy="50%" r="50%" fx="25%" fy="25%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="70%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0369A1" />
        </radialGradient>

        {/* 3. تدرج الفئة الثالثة (11-25): الأرجواني الملكي (Amethyst) */}
        <radialGradient id="gem-tier-3" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#F5D0FE" />
          <stop offset="40%" stopColor="#D946EF" />
          <stop offset="100%" stopColor="#701A75" />
        </radialGradient>

        {/* 4. تدرج الفئة الرابعة (26-39): الذهب الصافي */}
        <linearGradient id="gem-tier-4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="45%" stopColor="#EAB308" />
          <stop offset="55%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>

        {/* 5. تدرج الفئة الخامسة (40-50): الذهب البريميوم مع وهج بلاتيني */}
        <radialGradient id="gem-tier-5" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="20%" stopColor="#FDE68A" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>

        {/* تأثير المسح الضوئي (The Shine Effect Overlay) */}
        <linearGradient id="gem-shine-overlay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="45%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.6" />
          <stop offset="55%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* فلتر التوهج الاحترافي (Glow Filter) */}
        <filter id="gem-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* فلتر العمق والظلال الداخلية (Inner Shadow for Premium feel) */}
        <filter id="gem-inner-shadow">
          <feOffset dx="0" dy="1" />
          <feGaussianBlur stdDeviation="1" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="black" floodOpacity="0.3" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>
    </svg>
  );
};

export default GemDefinitions;