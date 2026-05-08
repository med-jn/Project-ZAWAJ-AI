'use client';
/**
 * components/mediators/LevelBadge.tsx
 *
 * Mediator level badge — premium production version.
 * Features: shimmer animation on gold/platinum/diamond,
 * glow pulse on hover, icon per level, full ARIA label.
 */

import { motion } from 'framer-motion';

/* ── Level config ───────────────────────────────────── */
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
  none: {
    label:   'مبتدئ',
    icon:    '○',
    color:   '#9CA3AF',
    bg:      'rgba(156,163,175,0.12)',
    border:  'rgba(156,163,175,0.20)',
    shimmer: false,
    pulse:   false,
  },
  bronze: {
    label:   'برونزي',
    icon:    '🥉',
    color:   '#CD7F32',
    bg:      'rgba(205,127,50,0.12)',
    border:  'rgba(205,127,50,0.28)',
    shimmer: false,
    pulse:   false,
  },
  silver: {
    label:   'فضي',
    icon:    '🥈',
    color:   '#C0C0C0',
    bg:      'rgba(192,192,192,0.12)',
    border:  'rgba(192,192,192,0.28)',
    shimmer: false,
    pulse:   false,
  },
  gold: {
    label:   'ذهبي',
    icon:    '🥇',
    color:   '#D4AF37',
    bg:      'rgba(212,175,55,0.15)',
    border:  'rgba(212,175,55,0.40)',
    shimmer: true,
    pulse:   false,
  },
  platinum: {
    label:   'بلاتيني',
    icon:    '💎',
    color:   '#E5E4E2',
    bg:      'rgba(229,228,226,0.12)',
    border:  'rgba(229,228,226,0.30)',
    shimmer: true,
    pulse:   true,
  },
  diamond: {
    label:   'ماسي',
    icon:    '✦',
    color:   '#B2EBF2',
    bg:      'rgba(178,235,242,0.14)',
    border:  'rgba(178,235,242,0.38)',
    shimmer: true,
    pulse:   true,
  },
};

const FALLBACK = LEVEL_MAP.none;

/* ── Props ──────────────────────────────────────────── */
interface LevelBadgeProps {
  level: string;
  /** Show icon alongside label (default true) */
  showIcon?: boolean;
  className?: string;
}

/* ── Component ──────────────────────────────────────── */
export function LevelBadge({ level, showIcon = true, className = '' }: LevelBadgeProps) {
  const key = (level ?? '').toLowerCase().trim();
  const cfg = LEVEL_MAP[key] ?? FALLBACK;

  return (
    <motion.span
      aria-label={`مستوى الوسيط: ${cfg.label}`}
      whileHover={cfg.pulse ? { scale: 1.08 } : {}}
      className={`relative inline-flex items-center gap-1 overflow-hidden select-none ${className}`}
      style={{
        padding:      '2px 8px',
        borderRadius: '10px',
        fontSize:     '10px',
        fontWeight:   900,
        letterSpacing:'0.03em',
        color:        cfg.color,
        background:   cfg.bg,
        border:       `1px solid ${cfg.border}`,
        boxShadow:    cfg.pulse
          ? `0 0 10px ${cfg.border}, inset 0 0 6px ${cfg.bg}`
          : undefined,
      }}
    >
      {/* Shimmer sweep */}
      {cfg.shimmer && (
        <motion.span
          aria-hidden
          animate={{ x: ['-120%', '220%'] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut', repeatDelay: 1.2 }}
          style={{
            position:   'absolute',
            top:        0,
            left:       0,
            width:      '45%',
            height:     '100%',
            background: `linear-gradient(90deg, transparent, ${cfg.color}30, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Pulse glow ring */}
      {cfg.pulse && (
        <motion.span
          aria-hidden
          animate={{ opacity: [0.25, 0.6, 0.25], scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          style={{
            position:      'absolute',
            inset:         -2,
            borderRadius:  '12px',
            border:        `1px solid ${cfg.color}55`,
            pointerEvents: 'none',
          }}
        />
      )}

      {showIcon && (
        <span aria-hidden style={{ fontSize: '9px', lineHeight: 1 }}>
          {cfg.icon}
        </span>
      )}

      <span style={{ position: 'relative', zIndex: 1 }}>{cfg.label}</span>
    </motion.span>
  );
}