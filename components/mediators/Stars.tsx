'use client';
/**
 * components/mediators/Stars.tsx
 * نجوم تقييم — RTL: مرتبة من اليمين (5) لليسار (1)
 * تدعم التقييمات الكسرية (مثل 4.2 = 4 نجوم كاملة + 0.2 نجمة جزئية على اليسار)
 */

import { useState, useCallback, useId } from 'react';
import { motion, AnimatePresence }       from 'framer-motion';

const TOTAL = 5;
const GOLD  = '#D4AF37';
const HOVER = '#F5D060';
const EMPTY = 'rgba(255,255,255,0.13)';
const GLOW  = 'rgba(212,175,55,0.55)';

const STAR_POINTS = '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26';

interface StarsProps {
  value:        number;          // 0–5، يدعم كسور مثل 4.2
  size?:        number;
  interactive?: boolean;
  onChange?:    (v: number) => void;
  className?:   string;
}

/** نسبة امتلاء النجمة (0–1) بناءً على القيمة الكلية وفهرس النجمة */
function getFill(starIndex: number, value: number): number {
  return Math.min(1, Math.max(0, value - starIndex));
}

/** مكوّن نجمة واحدة يدعم الامتلاء الجزئي */
function StarSvg({
  fill,
  size,
  uid,
  index,
  isHovered,
}: {
  fill:      number;   // 0–1
  size:      number;
  uid:       string;
  index:     number;
  isHovered: boolean;
}) {
  const gradId     = `${uid}-g${index}`;
  const fillColor  = isHovered ? HOVER : GOLD;
  const strokeColor = fill > 0 ? fillColor : 'rgba(255,255,255,0.10)';

  if (fill >= 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
        <polygon points={STAR_POINTS} fill={fillColor} stroke={fillColor} strokeWidth="0.8" />
      </svg>
    );
  }

  if (fill <= 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
        <polygon points={STAR_POINTS} fill={EMPTY} stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
      </svg>
    );
  }

  // نجمة جزئية — gradient من اليمين لليسار (RTL)
  // fill=0.2 → 20% من اليمين ذهبي، 80% من اليسار فارغ
  const pct = `${((1 - fill) * 100).toFixed(1)}%`;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <defs>
        {/* x1=0 (يسار) → x2=1 (يمين)؛ الذهبي يبدأ من اليمين */}
        <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
          <stop offset={pct}  stopColor={EMPTY}     />
          <stop offset={pct}  stopColor={fillColor} />
        </linearGradient>
      </defs>
      <polygon
        points={STAR_POINTS}
        fill={`url(#${gradId})`}
        stroke={strokeColor}
        strokeWidth="0.8"
      />
    </svg>
  );
}

export function Stars({
  value,
  size = 13,
  interactive = false,
  onChange,
  className = '',
}: StarsProps) {
  const [hovered, setHovered] = useState(0);
  const [popped,  setPopped]  = useState<number | null>(null);
  const uid = useId().replace(/:/g, '');

  /**
   * RTL: نعرض النجوم من TOTAL←1 (يمين←يسار)
   * الفهرس الحقيقي للنجمة = TOTAL - displayIndex - 1
   * مثال TOTAL=5: نعرض [5,4,3,2,1] → النجمة الجزئية دائماً على اليسار
   */
  const displayValue = interactive && hovered > 0 ? hovered : value;

  const click = useCallback((s: number) => {
    if (!interactive) return;
    onChange?.(s);
    setPopped(s);
    setTimeout(() => setPopped(null), 380);
  }, [interactive, onChange]);

  const handleKey = useCallback((e: React.KeyboardEvent, s: number) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); click(s); }
    // ArrowRight في RTL = تقليل، ArrowLeft = زيادة
    if (e.key === 'ArrowRight' && s > 1)     onChange?.(s - 1);
    if (e.key === 'ArrowLeft'  && s < TOTAL) onChange?.(s + 1);
  }, [interactive, click, onChange]);

  // نبني المصفوفة مقلوبة: [TOTAL-1, TOTAL-2, ..., 0] (فهارس 0-based)
  const starIndices = Array.from({ length: TOTAL }, (_, i) => TOTAL - 1 - i);

  return (
    <div
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`تقييم ${value.toFixed(1)} من ${TOTAL}`}
      className={`relative inline-flex items-center gap-[3px] ${className}`}
      style={{ direction: 'ltr' }}   // نتحكم بالترتيب يدوياً عبر المصفوفة المقلوبة
    >
      {starIndices.map((i) => {
        const s         = i + 1;                          // القيمة الحقيقية للنجمة (1–5)
        const fillRatio = getFill(i, displayValue);
        const isHov     = interactive && hovered === s;

        return (
          <motion.span
            key={`${uid}-${s}`}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? value >= s : undefined}
            tabIndex={interactive ? 0 : -1}
            onMouseEnter={() => interactive && setHovered(s)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => click(s)}
            onKeyDown={e => handleKey(e, s)}
            animate={popped === s ? { scale: [1, 1.5, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              display:  'inline-flex',
              outline:  'none',
              position: 'relative',
              cursor:   interactive ? 'pointer' : 'default',
            }}
          >
            {/* توهج خلف النجمة النشطة */}
            {interactive && fillRatio > 0 && (
              <span aria-hidden style={{
                position:     'absolute',
                inset:         -size * 0.3,
                borderRadius: '50%',
                background:   GLOW,
                filter:       `blur(${size * 0.45}px)`,
                opacity:      isHov ? 0.7 : 0.25,
                transition:   'opacity 0.2s',
                pointerEvents:'none',
              }} />
            )}
            <StarSvg
              fill={fillRatio}
              size={size}
              uid={uid}
              index={i}
              isHovered={isHov}
            />
          </motion.span>
        );
      })}

      {/* وميض عند النقر */}
      <AnimatePresence>
        {popped !== null && (
          <motion.span
            key="burst"
            aria-hidden
            initial={{ opacity: 0.9, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.2 }}
            exit={{}}
            transition={{ duration: 0.38, ease: 'easeOut' }}
            style={{
              position:     'absolute',
              top:          '50%',
              // موضع الوميض بناءً على الترتيب المقلوب
              left:         `${(TOTAL - popped) * (size + 3) + size / 2}px`,
              transform:    'translate(-50%,-50%)',
              width:         size,
              height:        size,
              borderRadius: '50%',
              background:   GLOW,
              pointerEvents:'none',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}