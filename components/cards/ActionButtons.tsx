'use client';
/**
 * 📁 components/cards/ActionButtons.tsx — ZAWAJ AI
 * مكون مستقل لأزرار الإعجاب والتجاهل
 * ✅ أزرار مستديرة ثلاثية الأبعاد — بدون نصوص
 * ✅ يمكن تخصيص الحجم والأيقونات من الخارج
 */

import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export interface ActionButtonsProps {
  onLike:    () => void;
  onPass:    () => void;
  likeFlash: boolean;
  passFlash: boolean;
  busy?:     boolean;
  /** حجم الزر بالبكسل — افتراضي 62 */
  size?:     number;
}

export default function ActionButtons({
  onLike,
  onPass,
  likeFlash,
  passFlash,
  busy,
  size = 62,
}: ActionButtonsProps) {
  return (
    <div style={{
      position:        'fixed',
      left:            0,
      right:           0,
      // safe-area + nav + مسافة هواء
      bottom:          'calc(var(--nav-h-safe) + var(--sp-4))',
      zIndex:          180,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             'clamp(56px, 18vw, 100px)',
      // منع أي تداخل مع عناصر البطاقة
      pointerEvents:   'none',
    }}>
      {/* زر الإعجاب */}
      <Btn3D
        variant="like"
        size={size}
        active={likeFlash}
        busy={busy}
        onClick={onLike}
        icon={<ThumbsUp size={Math.round(size * 0.38)} color="#ffffff" fill="#ffffff" strokeWidth={1.4} />}
      />

      {/* زر التجاهل */}
      <Btn3D
        variant="pass"
        size={size}
        active={passFlash}
        busy={busy}
        onClick={onPass}
        icon={<ThumbsDown size={Math.round(size * 0.38)} color="#fff" strokeWidth={2} />}
      />
    </div>
  );
}

// ── زر ثلاثي الأبعاد ──────────────────────────────────────────
function Btn3D({
  variant,
  size,
  active,
  busy,
  onClick,
  icon,
}: {
  variant: 'like' | 'pass';
  size:    number;
  active:  boolean;
  busy?:   boolean;
  onClick: () => void;
  icon:    React.ReactNode;
}) {
  const isLike = variant === 'like';

  const faceColor = isLike
    ? active
      ? 'linear-gradient(145deg,#e8293f 0%,#a3001a 100%)'
      : 'linear-gradient(145deg,#c8002c 0%,#8a0018 100%)'
    : active
      ? 'linear-gradient(145deg,#555570 0%,#35354a 100%)'
      : 'linear-gradient(145deg,#3a3a52 0%,#22223a 100%)';

  const depthColor = isLike ? '#5a000e' : '#0e0e1e';

  const glowColor = isLike
    ? active ? 'rgba(200,0,44,0.65)' : 'rgba(192,0,42,0.38)'
    : active ? 'rgba(80,80,120,0.5)' : 'rgba(30,30,60,0.35)';

  const boxShadow = active
    ? `0 2px 0 ${depthColor}, 0 4px 14px ${glowColor}, inset 0 2px 4px rgba(0,0,0,0.35)`
    : `0 5px 0 ${depthColor}, 0 8px 22px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.22)`;

  return (
    <motion.button
      onClick={onClick}
      disabled={busy}
      whileTap={{ scale: 0.84, y: 4 }}
      whileHover={{ scale: 1.07, y: -2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      style={{
        width:          size,
        height:         size,
        borderRadius:   '50%',
        border:         'none',
        outline:        'none',
        cursor:         busy ? 'not-allowed' : 'pointer',
        opacity:        busy ? 0.4 : 1,
        flexShrink:     0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        position:       'relative',
        overflow:       'hidden',
        background:     faceColor,
        color:          '#fff',
        boxShadow,
        transition:     'box-shadow 0.18s, background 0.18s',
        // إعادة pointerEvents للأزرار نفسها (الحاوي disabled)
        pointerEvents:  busy ? 'none' : 'auto',
      }}
    >
      {/* بريق علوي */}
      <div style={{
        position:     'absolute',
        inset:        0,
        borderRadius: '50%',
        background:   'radial-gradient(ellipse at 38% 22%, rgba(255,255,255,0.22) 0%, transparent 62%)',
        pointerEvents: 'none',
      }} />
      {icon}
    </motion.button>
  );
}