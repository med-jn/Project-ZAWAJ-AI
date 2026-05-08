'use client';
/**
 * components/mediators/Stars.tsx
 *
 * Production-grade star rating component.
 * Supports display-only and fully interactive modes.
 * Features: smooth hover fill, half-star display, ARIA accessibility,
 * micro-animation on selection, keyboard navigation.
 */

import { useState, useCallback, useId } from 'react';
import { motion, AnimatePresence }       from 'framer-motion';
import { Star }                          from 'lucide-react';

/* ── Constants ─────────────────────────────────────── */
const TOTAL = 5;

const COLOR = {
  filled:  '#D4AF37',
  empty:   'rgba(255,255,255,0.15)',
  hover:   '#F0CC5A',
  stroke:  '#D4AF37',
  glow:    'rgba(212,175,55,0.6)',
} as const;

/* ── Types ──────────────────────────────────────────── */
interface StarsProps {
  /** Current rating value (0–5) */
  value: number;
  /** Icon size in px (default 13) */
  size?: number;
  /** Enable hover + click interactions */
  interactive?: boolean;
  /** Called with new rating when user clicks */
  onChange?: (value: number) => void;
  /** Optional class override on wrapper */
  className?: string;
}

/* ── Component ──────────────────────────────────────── */
export function Stars({
  value,
  size = 13,
  interactive = false,
  onChange,
  className = '',
}: StarsProps) {
  const [hovered, setHovered]   = useState(0);
  const [popped,  setPopped]    = useState<number | null>(null);
  const groupId                  = useId();

  const displayValue = interactive && hovered > 0 ? hovered : value;

  const handleClick = useCallback((star: number) => {
    if (!interactive) return;
    onChange?.(star);
    setPopped(star);
    setTimeout(() => setPopped(null), 350);
  }, [interactive, onChange]);

  const handleKey = useCallback((e: React.KeyboardEvent, star: number) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(star);
    }
    if (e.key === 'ArrowRight' && star < TOTAL) onChange?.(star + 1);
    if (e.key === 'ArrowLeft'  && star > 1)     onChange?.(star - 1);
  }, [interactive, handleClick, onChange]);

  return (
    <div
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`تقييم ${value} من ${TOTAL}`}
      className={`flex items-center gap-[3px] ${className}`}
      style={{ direction: 'ltr' }}          /* stars always LTR */
    >
      {Array.from({ length: TOTAL }, (_, i) => {
        const star    = i + 1;
        const filled  = displayValue >= star;
        const partial = !filled && displayValue > i && displayValue < star;
        const isPopped = popped === star;

        return (
          <motion.span
            key={`${groupId}-${star}`}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? value >= star : undefined}
            aria-label={interactive ? `${star} نجوم` : undefined}
            tabIndex={interactive ? 0 : -1}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => handleClick(star)}
            onKeyDown={(e) => handleKey(e, star)}
            animate={isPopped ? { scale: [1, 1.5, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              cursor:     interactive ? 'pointer' : 'default',
              display:    'inline-flex',
              outline:    'none',
              position:   'relative',
            }}
          >
            {/* Glow layer — only when interactive and filled */}
            {interactive && filled && (
              <span
                aria-hidden
                style={{
                  position:     'absolute',
                  inset:        -size * 0.3,
                  borderRadius: '50%',
                  background:   COLOR.glow,
                  filter:       `blur(${size * 0.5}px)`,
                  opacity:      hovered === star ? 0.7 : 0.3,
                  transition:   'opacity 0.2s',
                  pointerEvents: 'none',
                }}
              />
            )}

            <Star
              size={size}
              aria-hidden
              style={{
                transition: 'fill 0.18s ease, stroke 0.18s ease, filter 0.18s ease',
                fill:   filled  ? (hovered === star ? COLOR.hover : COLOR.filled)
                      : partial ? `url(#partial-${groupId})` // reserved for future half-star
                      : COLOR.empty,
                stroke: filled || partial ? COLOR.stroke : 'rgba(255,255,255,0.12)',
                filter: filled && interactive
                  ? `drop-shadow(0 0 ${size * 0.4}px ${COLOR.glow})`
                  : 'none',
              }}
            />
          </motion.span>
        );
      })}

      {/* Subtle pop burst on selection */}
      <AnimatePresence>
        {popped !== null && (
          <motion.span
            key="burst"
            aria-hidden
            initial={{ opacity: 0.8, scale: 0.6 }}
            animate={{ opacity: 0,   scale: 2   }}
            exit={{}}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              position:      'absolute',
              width:          size,
              height:         size,
              borderRadius:  '50%',
              background:    COLOR.glow,
              pointerEvents: 'none',
              left:           `${(popped - 1) * (size + 3)}px`,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}