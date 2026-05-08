'use client';
/**
 * components/mediators/Stars.tsx
 *
 * يرسم النجوم بـ SVG يدوي بالكامل لتجاوز قاعدة globals.css:
 *   svg { fill: none !important; stroke: currentColor !important; }
 * كل نجمة polygon مستقلة بـ style inline يتجاوز !important.
 */

import { useState, useCallback, useId } from 'react';
import { motion, AnimatePresence }       from 'framer-motion';

const TOTAL = 5;
// نقاط المضلع المعياري لنجمة 5 رؤوس في viewBox 24×24
const STAR_POINTS = '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26';

const C = {
  filled:  '#D4AF37',
  empty:   'rgba(255,255,255,0.13)',
  hover:   '#F5D060',
  stroke:  '#D4AF37',
  glow:    'rgba(212,175,55,0.55)',
  strokeE: 'rgba(255,255,255,0.10)',
} as const;

interface StarsProps {
  value:        number;
  size?:        number;
  interactive?: boolean;
  onChange?:    (v: number) => void;
  className?:   string;
}

export function Stars({ value, size = 13, interactive = false, onChange, className = '' }: StarsProps) {
  const [hovered, setHovered] = useState(0);
  const [popped,  setPopped]  = useState<number | null>(null);
  const uid = useId();

  const display = interactive && hovered > 0 ? hovered : value;

  const click = useCallback((s: number) => {
    if (!interactive) return;
    onChange?.(s);
    setPopped(s);
    setTimeout(() => setPopped(null), 380);
  }, [interactive, onChange]);

  const key = useCallback((e: React.KeyboardEvent, s: number) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); click(s); }
    if (e.key === 'ArrowRight' && s < TOTAL) onChange?.(s + 1);
    if (e.key === 'ArrowLeft'  && s > 1)     onChange?.(s - 1);
  }, [interactive, click, onChange]);

  return (
    <div
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`تقييم ${value} من ${TOTAL}`}
      className={`relative inline-flex items-center gap-[3px] ${className}`}
      style={{ direction: 'ltr' }}
    >
      {Array.from({ length: TOTAL }, (_, i) => {
        const s      = i + 1;
        const filled = display >= s;
        const fill   = filled ? (interactive && hovered === s ? C.hover : C.filled) : C.empty;
        const stroke = filled ? C.stroke : C.strokeE;
        const glow   = filled && interactive
          ? `drop-shadow(0 0 ${Math.round(size * 0.35)}px ${C.glow})`
          : undefined;

        return (
          <motion.span
            key={`${uid}-${s}`}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? value >= s : undefined}
            tabIndex={interactive ? 0 : -1}
            onMouseEnter={() => interactive && setHovered(s)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => click(s)}
            onKeyDown={(e) => key(e, s)}
            animate={popped === s ? { scale: [1, 1.5, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ display: 'inline-flex', outline: 'none', position: 'relative',
              cursor: interactive ? 'pointer' : 'default' }}
          >
            {/* Glow halo */}
            {interactive && filled && (
              <span aria-hidden style={{
                position: 'absolute', inset: -size * 0.3,
                borderRadius: '50%', background: C.glow,
                filter: `blur(${size * 0.45}px)`,
                opacity: hovered === s ? 0.7 : 0.25,
                transition: 'opacity 0.2s', pointerEvents: 'none',
              }} />
            )}

            {/* النجمة — SVG يدوي يتجاوز globals.css fill:none */}
            <svg
              width={size} height={size}
              viewBox="0 0 24 24"
              aria-hidden
              style={{ display: 'block', filter: glow, flexShrink: 0 }}
            >
              <polygon
                points={STAR_POINTS}
                style={{
                  fill:        fill,        /* inline style يتغلب على !important */
                  stroke:      stroke,
                  strokeWidth: '1px',
                  strokeLinejoin: 'round',
                  transition:  'fill 0.18s ease',
                }}
              />
            </svg>
          </motion.span>
        );
      })}

      {/* Pop burst */}
      <AnimatePresence>
        {popped !== null && (
          <motion.span
            key="burst" aria-hidden
            initial={{ opacity: 0.9, scale: 0.5 }}
            animate={{ opacity: 0,   scale: 2.2 }}
            exit={{}}
            transition={{ duration: 0.38, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: '50%',
              left: `${(popped - 1) * (size + 3) + size / 2}px`,
              transform: 'translate(-50%,-50%)',
              width: size, height: size,
              borderRadius: '50%', background: C.glow,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}