'use client';
/**
 * 📁 components/cards/ActionButtons.tsx — ZAWAJ AI Premium
 * ✅ زجاج نقي شفاف — بدون أي لون
 * ✅ إعجاب يمين / تجاهل يسار (RTL منطقي)
 * ✅ لمعان فقط عند التفعيل
 * ✅ haptic feedback عبر Capacitor
 */

import { motion }           from 'framer-motion';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

// Haptic خفيف عبر Capacitor — يتجاهل الخطأ إن لم يكن متاحاً
async function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch {}
}

export interface ActionButtonsProps {
  onLike:    () => void;
  onPass:    () => void;
  likeFlash: boolean;
  passFlash: boolean;
  busy?:     boolean;
  size?:     number;
}

export default function ActionButtons({
  onLike,
  onPass,
  likeFlash,
  passFlash,
  busy,
  size = 66,
}: ActionButtonsProps) {
  const iconSize = Math.round(size * 0.40);

  const handleLike = () => { haptic('medium'); onLike(); };
  const handlePass = () => { haptic('light');  onPass(); };

  return (
    <div style={{
      position:       'fixed',
      left:            0,
      right:           0,
      bottom:         'calc(var(--nav-h-safe) + var(--sp-5))',
      zIndex:          180,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            'clamp(64px, 20vw, 112px)',
      pointerEvents:  'none',
    }}>

      {/* تجاهل — يسار */}
      <GlassBtn
        variant="pass"
        size={size}
        flash={passFlash}
        busy={busy}
        onClick={handlePass}
        icon={
          <ThumbsDown
            size={iconSize}
            strokeWidth={1.8}
            style={{ color: 'rgba(255,255,255,0.85)' }}
          />
        }
      />

      {/* إعجاب — يمين */}
      <GlassBtn
        variant="like"
        size={size}
        flash={likeFlash}
        busy={busy}
        onClick={handleLike}
        icon={
          <ThumbsUp
            size={iconSize}
            strokeWidth={1.8}
            fill="rgba(255,255,255,0.85)"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          />
        }
      />
    </div>
  );
}

function GlassBtn({ variant, size, flash, busy, onClick, icon }: {
  variant: 'like' | 'pass';
  size:    number;
  flash:   boolean;
  busy?:   boolean;
  onClick: () => void;
  icon:    React.ReactNode;
}) {
  const glowRgb = variant === 'like' ? '34,197,94' : '220,38,38';

  return (
    <motion.button
      onClick={onClick}
      disabled={busy}
      initial={false}
      animate={{
        boxShadow: flash
          ? `0 0 0 1.5px rgba(${glowRgb},0.6),
             0 0 28px 6px rgba(${glowRgb},0.35),
             0 6px 0 rgba(0,0,0,0.30),
             inset 0 1px 0 rgba(255,255,255,0.50),
             inset 0 -1px 0 rgba(0,0,0,0.16)`
          : `0 6px 0 rgba(0,0,0,0.26),
             0 2px 20px rgba(0,0,0,0.20),
             inset 0 1px 0 rgba(255,255,255,0.38),
             inset 0 -1px 0 rgba(0,0,0,0.12)`,
        filter: flash
          ? `brightness(1.4) drop-shadow(0 0 10px rgba(${glowRgb},0.55))`
          : 'brightness(1) drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
      }}
      transition={{ type: 'spring', stiffness: 480, damping: 20 }}
      whileTap={{ scale: 0.80, y: 5,
        transition: { type: 'spring', stiffness: 600, damping: 18 } }}
      whileHover={{ scale: 1.07, y: -2,
        transition: { type: 'spring', stiffness: 400, damping: 22 } }}
      style={{
        width:           size,
        height:          size,
        borderRadius:   '50%',
        border:         '1px solid rgba(255,255,255,0.24)',
        outline:        'none',
        cursor:          busy ? 'not-allowed' : 'pointer',
        opacity:         busy ? 0.32 : 1,
        flexShrink:      0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        position:       'relative',
        overflow:       'hidden',
        background:     'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        pointerEvents:   busy ? 'none' : 'auto',
      }}
    >
      {/* انعكاس ضوء علوي */}
      <div style={{
        position:     'absolute',
        top: 0, left: 0, right: 0,
        height:      '50%',
        borderRadius:'50% 50% 0 0',
        background:  'linear-gradient(180deg,rgba(255,255,255,0.24) 0%,transparent 100%)',
        pointerEvents:'none',
      }} />

      {/* وميض اللون عند التفعيل */}
      <motion.div
        animate={{ opacity: flash ? 1 : 0, scale: flash ? 1.1 : 0.5 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          position:     'absolute',
          inset:         0,
          borderRadius: '50%',
          background:   `radial-gradient(circle at 50% 44%, rgba(${glowRgb},0.30) 0%, transparent 68%)`,
          pointerEvents:'none',
        }}
      />

      {/* خط حافة سفلية — عمق */}
      <div style={{
        position:     'absolute',
        bottom:        0,
        left:         '12%', right: '12%',
        height:        1,
        background:   'rgba(0,0,0,0.22)',
        borderRadius: '50%',
        pointerEvents:'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>{icon}</div>
    </motion.button>
  );
}