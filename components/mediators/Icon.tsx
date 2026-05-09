'use client';
/**
 * components/mediators/Icon.tsx
 *
 * Wrapper حول Lucide يتجاوز globals.css عبر class .icon-wrap
 * الذي يُعرَّف في globals.css كاستثناء:
 *   .icon-wrap svg { fill: revert-layer !important; ... }
 *
 * الاستخدام:
 *   <Icon i={Crown} size={16} color="#D4AF37" />
 *   <Icon i={Star}  size={14} color="#D4AF37" fill="#D4AF37" />
 */

import type { LucideIcon } from 'lucide-react';

interface IconProps {
  i:            LucideIcon;
  size?:        number;
  color?:       string;
  fill?:        string;
  strokeWidth?: number;
  className?:   string;
  label?:       string;
}

export function Icon({
  i: Comp,
  size        = 16,
  color       = 'currentColor',
  fill,
  strokeWidth = 2,
  className   = '',
  label,
}: IconProps) {
  return (
    <span
      className={`icon-wrap inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ color, width: size, height: size }}
      aria-hidden={!label}
      aria-label={label}
    >
      <Comp
        size={size}
        strokeWidth={strokeWidth}
        style={fill ? { fill } : undefined}
      />
    </span>
  );
}

/**
 * StarFilled — نجمة مملوءة برسم SVG يدوي
 * لأن Lucide Star لا تدعم fill بدون override
 */
const STAR_PTS = '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26';

export function StarFilled({
  size    = 14,
  fill    = '#D4AF37',
  stroke  = '#D4AF37',
  opacity = 1,
}: {
  size?:    number;
  fill?:    string;
  stroke?:  string;
  opacity?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden
      style={{ display: 'block', flexShrink: 0, opacity }}>
      <polygon points={STAR_PTS}
        style={{ fill, stroke, strokeWidth: '1px', strokeLinejoin: 'round' }} />
    </svg>
  );
}