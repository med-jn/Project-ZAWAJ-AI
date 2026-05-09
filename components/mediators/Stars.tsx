'use client';
/**
 * components/mediators/Stars.tsx
 * نجوم تقييم — تستخدم StarFilled (SVG يدوي) لتجاوز fill:none !important
 */

import { useState, useCallback, useId } from 'react';
import { motion, AnimatePresence }       from 'framer-motion';
import { StarFilled }                    from './Icon';

const TOTAL = 5;
const GOLD  = '#D4AF37';
const HOVER = '#F5D060';
const EMPTY = 'rgba(255,255,255,0.13)';
const GLOW  = 'rgba(212,175,55,0.55)';

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

  const handleKey = useCallback((e: React.KeyboardEvent, s: number) => {
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
        const fill   = filled ? (interactive && hovered === s ? HOVER : GOLD) : EMPTY;
        const stroke = filled ? GOLD : 'rgba(255,255,255,0.10)';

        return (
          <motion.span key={`${uid}-${s}`}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? value >= s : undefined}
            tabIndex={interactive ? 0 : -1}
            onMouseEnter={() => interactive && setHovered(s)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => click(s)}
            onKeyDown={e => handleKey(e, s)}
            animate={popped === s ? { scale: [1, 1.5, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ display: 'inline-flex', outline: 'none', position: 'relative',
              cursor: interactive ? 'pointer' : 'default' }}
          >
            {interactive && filled && (
              <span aria-hidden style={{
                position: 'absolute', inset: -size * 0.3, borderRadius: '50%',
                background: GLOW, filter: `blur(${size * 0.45}px)`,
                opacity: hovered === s ? 0.7 : 0.25, transition: 'opacity 0.2s', pointerEvents: 'none',
              }} />
            )}
            <StarFilled size={size} fill={fill} stroke={stroke} />
          </motion.span>
        );
      })}

      <AnimatePresence>
        {popped !== null && (
          <motion.span key="burst" aria-hidden
            initial={{ opacity: 0.9, scale: 0.5 }} animate={{ opacity: 0, scale: 2.2 }} exit={{}}
            transition={{ duration: 0.38, ease: 'easeOut' }}
            style={{ position: 'absolute', top: '50%',
              left: `${(popped - 1) * (size + 3) + size / 2}px`,
              transform: 'translate(-50%,-50%)', width: size, height: size,
              borderRadius: '50%', background: GLOW, pointerEvents: 'none' }} />
        )}
      </AnimatePresence>
    </div>
  );
}