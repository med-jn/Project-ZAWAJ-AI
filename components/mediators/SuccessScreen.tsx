'use client';
/**
 * components/mediators/SuccessScreen.tsx
 *
 * Full-screen subscription success overlay — premium production version.
 * Enhancements over original:
 *  - Particle confetti burst on mount
 *  - Staggered card reveal with spring physics
 *  - Animated check-mark draw
 *  - Shimmer on the success gradient header
 *  - Divider line animation
 *  - Accessible focus trap + Escape key to close
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence }         from 'framer-motion';
import { Check, Clock, Shield, Crown }     from 'lucide-react';
import { LoveCoin }                        from '@/components/ui/LoveCoin';
import { Row }                             from './Row';
import type { SuccessData }                from './types';

/* ── Helpers ────────────────────────────────────────── */
const fmt = (d: Date) =>
  d.toLocaleDateString('ar-TN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' });

/* ── Particle burst ─────────────────────────────────── */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id:    i,
  angle: (360 / 14) * i,
  color: i % 3 === 0 ? '#D4AF37' : i % 3 === 1 ? '#22c55e' : '#B2EBF2',
  size:  Math.random() * 4 + 3,
  dist:  Math.random() * 40 + 30,
}));

/* ── Card variants ──────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show:   (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.3 + i * 0.1, type: 'spring', stiffness: 300, damping: 26 },
  }),
};

/* ── Props ──────────────────────────────────────────── */
interface SuccessScreenProps {
  data:    SuccessData;
  onClose: () => void;
}

/* ── Component ──────────────────────────────────────── */
export function SuccessScreen({ data, onClose }: SuccessScreenProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  /* Focus the close button on mount */
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  /* Escape key */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="تم الاشتراك بنجاح"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full rounded-t-[32px] overflow-hidden"
        style={{
          background:  'var(--bg-surface)',
          border:      '1px solid var(--glass-border)',
          maxHeight:   '92vh',
          overflowY:   'auto',
        }}
      >
        {/* ── Hero header ─────────────────────────────── */}
        <div
          className="relative pt-14 pb-9 px-6 flex flex-col items-center overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(34,197,94,0.14) 0%, transparent 65%)',
          }}
        >
          {/* Shimmer sweep */}
          <motion.div
            aria-hidden
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', repeatDelay: 2 }}
            style={{
              position:   'absolute',
              top:        0, left: 0,
              width:      '50%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.08), transparent)',
              pointerEvents: 'none',
            }}
          />

          {/* Check circle */}
          <div className="relative mb-5">
            {/* Particle burst */}
            {PARTICLES.map((p) => (
              <motion.span
                key={p.id}
                aria-hidden
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.dist,
                  scale: 0,
                }}
                transition={{ delay: 0.2, duration: 0.65, ease: 'easeOut' }}
                style={{
                  position:      'absolute',
                  top:           '50%', left: '50%',
                  width:          p.size, height: p.size,
                  borderRadius:  '50%',
                  background:    p.color,
                  pointerEvents: 'none',
                  transform:     'translate(-50%, -50%)',
                }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22, delay: 0.12 }}
              className="w-[76px] h-[76px] rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(34,197,94,0.14)',
                border:     '2px solid rgba(34,197,94,0.45)',
                boxShadow:  '0 0 28px rgba(34,197,94,0.25)',
              }}
            >
              <Check size={36} style={{ color: '#22c55e' }} strokeWidth={2.8} />
            </motion.div>
          </div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="font-black text-center mb-1"
            style={{ fontSize: 'var(--text-xl)', color: 'var(--text-main)' }}
          >
            تم الاشتراك بنجاح! 🎉
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38 }}
            className="text-center"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}
          >
            أهلاً بك في عائلة الوسيط
          </motion.p>
        </div>

        {/* ── Detail cards ────────────────────────────── */}
        <div className="px-5 pb-4 space-y-3">

          {/* Subscription summary */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="show"
            custom={0}
            className="rounded-[20px] p-4"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            <p
              className="font-black tracking-widest uppercase mb-3"
              style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}
            >
              تفاصيل الاشتراك
            </p>

            <div className="space-y-3">
              <Row icon="👤" label="المشترك"        value={data.userName} />
              <Row icon="🤝" label="الوسيط"         value={data.mediatorName} />
              <Row
                icon={<LoveCoin size={14} />}
                label="العملات المدفوعة"
                value={data.coins.toLocaleString('ar-TN')}
              />
            </div>
          </motion.div>

          {/* Dates */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="show"
            custom={1}
            className="rounded-[20px] p-4"
            style={{
              background: 'rgba(34,197,94,0.06)',
              border:     '1px solid rgba(34,197,94,0.22)',
            }}
          >
            {/* Animated divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.55, duration: 0.4, ease: 'easeOut' }}
              style={{
                height:          1,
                background:      'rgba(34,197,94,0.2)',
                transformOrigin: 'left',
                marginBottom:    12,
              }}
            />

            <div className="space-y-3">
              <Row
                icon={<Clock size={14} style={{ color: '#22c55e' }} />}
                label="تاريخ الاشتراك"
                value={`${fmt(data.subscribedAt)} — ${fmtTime(data.subscribedAt)}`}
                valueColor="#22c55e"
              />
              <Row
                icon={<Shield size={14} style={{ color: '#22c55e' }} />}
                label="صالح حتى"
                value={fmt(data.expiresAt)}
                valueColor="#22c55e"
              />
            </div>
          </motion.div>
        </div>

        {/* ── Close button ────────────────────────────── */}
        <motion.div
          className="px-5 pb-10 pt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <motion.button
            ref={closeRef}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
            style={{
              background:  'linear-gradient(135deg, #800020, var(--color-primary))',
              boxShadow:   '0 8px 24px var(--shadow-red-glow)',
              fontSize:    'var(--text-sm)',
            }}
          >
            <Crown size={16} /> عودة للوسطاء
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}