import React from 'react';

// --- إعدادات النوع الأول: المستويات (بإطارات وأشكال هندسية) ---
const LEVEL_CONFIG = {
  bronze: {
    label: 'برونز',
    bg: 'bg-bronze-metallic',
    border: 'border-[#A0522D]',
    text: 'text-bronze-text',
    glow: '',
    // الشكل: دائرة بسيطة داخل دائرة الإطار
    icon: <div className="w-[0.4em] h-[0.4em] rounded-full bg-current" />
  },
  silver: {
    label: 'سيلفر',
    bg: 'bg-silver-metallic',
    border: 'border-[#BDBDBD]',
    text: 'text-silver-text',
    glow: '',
    // الشكل: دائرتين متداخلتين (دائرة داخل دائرة)
    icon: <div className="w-[0.7em] h-[0.7em] rounded-full border-[1.2px] border-current flex items-center justify-center">
            <div className="w-[0.3em] h-[0.3em] rounded-full bg-current opacity-60" />
          </div>
  },
  gold: {
    label: 'جولد',
    bg: 'bg-gold-metallic',
    border: 'border-[#D4AF37]',
    text: 'text-gold-text',
    glow: 'shadow-gold-glow',
    // الشكل: نجمة خماسية دقيقة داخل دائرة الإطار
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[0.75em] h-[0.75em]">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
  },
  diamond: {
    label: 'دايموند',
    bg: 'bg-diamond-metallic',
    border: 'border-[#E0F7FA]',
    text: 'text-diamond-text',
    glow: 'shadow-diamond-glow',
    // الشكل: ماسة هندسية دقيقة
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[0.75em] h-[0.75em]">
            <path d="M6 5h12l3 5-9 11-9-11 3-5z" />
            <path d="M9 5l3 5 3-5" />
          </svg>
  }
};

// --- إعدادات النوع الثاني: الفئات (بدون إطارات - انسيابية) ---
const SUB_CONFIG = {
  pro: { label: 'Pro', bg: 'bg-silver-metallic', text: 'text-silver-text' },
  max: { label: 'Max', bg: 'bg-silver-metallic', text: 'text-silver-text', glow: 'shadow-[0_0_10px_rgba(255,255,255,0.2)]' },
  ultra: { label: 'Ultra', bg: 'bg-diamond-metallic', text: 'text-diamond-text', glow: 'shadow-diamond-glow' }
};

// المكون الأول: للمستويات (برونز، سيلفر، جولد، دايموند)
export const LevelBadge = ({ type, size = 'text-base' }: { type: keyof typeof LEVEL_CONFIG, size?: string }) => {
  const cfg = LEVEL_CONFIG[type];
  return (
    <div className={`
      inline-flex items-center gap-[0.5em] 
      px-[0.8em] py-[0.3em] 
      rounded-[0.7em] border-[2.5px] 
      relative overflow-hidden
      ${cfg.bg} ${cfg.border} ${cfg.text} ${cfg.glow} ${size}
    `}>
      {/* طبقة اللمعان البطيئة (التي عرفناها في التايلويند) */}
      <div className="absolute inset-0 animate-slow-shine bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full" />
      
      {/* الدائرة المحيطة بالشكل الهندسي */}
      <div className="flex-shrink-0 w-[1.3em] h-[1.3em] rounded-full border-[1px] border-current/30 flex items-center justify-center bg-white/10 shadow-inner">
        {cfg.icon}
      </div>

      {/* النص - مع إزاحة بسيطة لتحسين المظهر الهندسي */}
      <span className="font-extrabold uppercase tracking-wide leading-none select-none">
        {cfg.label}
      </span>

      {/* تأثير اللمعان الداخلي الأبيض العلوى */}
      <div className="absolute inset-0 shadow-inner-shine pointer-events-none" />
    </div>
  );
};

// المكون الثاني: للفئات (Pro, Max, Ultra)
export const SubBadge = ({ type, size = 'text-base' }: { type: keyof typeof SUB_CONFIG, size?: string }) => {
  const cfg = SUB_CONFIG[type];
  return (
    <div className={`
      inline-flex items-center 
      px-[1.2em] py-[0.25em] 
      rounded-[0.5em] relative overflow-hidden
      font-black italic tracking-tighter uppercase
      ${cfg.bg} ${cfg.text} ${cfg.glow || ''} ${size}
    `}>
      <div className="absolute inset-0 animate-slow-shine bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full" />
      <span className="relative z-10">{cfg.label}</span>
    </div>
  );
};