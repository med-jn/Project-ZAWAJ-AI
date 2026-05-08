'use client';
/**
 * components/mediators/LevelBadge.tsx
 * يستخدم .badge-metal من globals.css + shimmer motion
 */

import { motion } from 'framer-motion';

interface LevelConfig {
  label:   string;
  icon:    string;
  color:   string;
  bg:      string;
  border:  string;
  shimmer: boolean;
  pulse:   boolean;
}

const LEVEL_MAP: Record<string, LevelConfig> = {
  none:     { label: 'مبتدئ',   icon: '○',  color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.22)', shimmer: false, pulse: false },
  bronze:   { label: 'برونزي', icon: '🥉', color: '#CD7F32', bg: 'rgba(205,127,50,0.14)',  border: 'rgba(205,127,50,0.32)',  shimmer: false, pulse: false },
  silver:   { label: 'فضي',    icon: '🥈', color: '#C8C8C8', bg: 'rgba(192,192,192,0.12)', border: 'rgba(192,192,192,0.30)', shimmer: false, pulse: false },
  gold:     { label: 'ذهبي',   icon: '🥇', color: '#D4AF37', bg: 'rgba(212,175,55,0.16)',  border: 'rgba(212,175,55,0.45)',  shimmer: true,  pulse: false },
  platinum: { label: 'بلاتيني',icon: '💎', color: '#E8E6E0', bg: 'rgba(229,228,226,0.13)', border: 'rgba(229,228,226,0.32)', shimmer: true,  pulse: true  },
  diamond:  { label: 'ماسي',   icon: '✦',  color: '#B2EBF2', bg: 'rgba(178,235,242,0.15)', border: 'rgba(178,235,242,0.40)', shimmer: true,  pulse: true  },
};

const FALLBACK = LEVEL_MAP.none;

interface LevelBadgeProps {
  level:     string;
  showIcon?: boolean;
  className?: string;
}

export function LevelBadge({ level, showIcon = true, className = '' }: LevelBadgeProps) {
  const key = (level ?? '').toLowerCase().trim().replace(/_level$/i, '');
  const cfg = LEVEL_MAP[key] ?? FALLBACK;

  return (
    <motion.span
      aria-label={`مستوى: ${cfg.label}`}
      whileHover={cfg.pulse ? { scale: 1.07 } : { scale: 1.03 }}
      className={`relative inline-flex items-center gap-[3px] overflow-hidden select-none ${className}`}
      style={{
        padding:       '2px 7px',
        borderRadius:  '10px',
        fontSize:      '10px',
        fontWeight:    900,
        letterSpacing: '0.03em',
        color:         cfg.color,
        background:    cfg.bg,
        border:        `1px solid ${cfg.border}`,
        boxShadow:     cfg.pulse
          ? `0 0 10px ${cfg.border}, inset 0 0 5px ${cfg.bg}`
          : `inset 0 1px 0 rgba(255,255,255,0.12)`,
      }}
    >
      {/* Shimmer sweep */}
      {cfg.shimmer && (
        <motion.span
          aria-hidden
          animate={{ x: ['-130%', '230%'] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut', repeatDelay: 1.4 }}
          style={{
            position:      'absolute',
            top: 0, left: 0,
            width:         '42%', height: '100%',
            background:    `linear-gradient(90deg, transparent, ${cfg.color}35, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Pulse ring */}
      {cfg.pulse && (
        <motion.span
          aria-hidden
          animate={{ opacity: [0.2, 0.55, 0.2], scale: [1, 1.07, 1] }}
          transition={{ repeat: Infinity, duration: 2.3, ease: 'easeInOut' }}
          style={{
            position:      'absolute',
            inset:         -2,
            borderRadius:  '12px',
            border:        `1px solid ${cfg.color}50`,
            pointerEvents: 'none',
          }}
        />
      )}

      {showIcon && (
        <span aria-hidden style={{ fontSize: '9px', lineHeight: 1 }}>{cfg.icon}</span>
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{cfg.label}</span>
    </motion.span>
  );
}