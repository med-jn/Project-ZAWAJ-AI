'use client';
/**
 * components/mediators/SuccessScreen.tsx
 * شاشة نجاح الاشتراك — particle burst + spring cards + Escape key
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence }         from 'framer-motion';
import { LoveCoin }                        from '@/components/ui/LoveCoin';
import { Row }                             from './Row';
import type { SuccessData }                from './types';

/* ── Clock icon SVG (يتجاوز fill:none) ─── */
function ClockIcon({ size = 14, color = '#22c55e' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" style={{ fill: 'none', stroke: color, strokeWidth: '2px' }} />
      <polyline points="12 6 12 12 16 14" style={{ fill: 'none', stroke: color, strokeWidth: '2px', strokeLinecap: 'round' }} />
    </svg>
  );
}

function ShieldIcon({ size = 14, color = '#22c55e' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block', flexShrink: 0 }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        style={{ fill: 'rgba(34,197,94,0.15)', stroke: color, strokeWidth: '2px', strokeLinejoin: 'round' }} />
    </svg>
  );
}

function CheckIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12"
        style={{ fill: 'none', stroke: '#22c55e', strokeWidth: '2.8px', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
    </svg>
  );
}

/* ── Particles ─────────────────────────── */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id:    i,
  angle: (360 / 14) * i,
  color: i % 3 === 0 ? '#D4AF37' : i % 3 === 1 ? '#22c55e' : '#B2EBF2',
  size:  Math.random() * 4 + 3,
  dist:  Math.random() * 42 + 28,
}));

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show:   (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.28 + i * 0.1, type: 'spring' as const, stiffness: 300, damping: 26 },
  }),
};

const fmt     = (d: Date) => d.toLocaleDateString('ar-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const fmtTime = (d: Date) => d.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' });

interface SuccessScreenProps { data: SuccessData; onClose: () => void; }

export function SuccessScreen({ data, onClose }: SuccessScreenProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { btnRef.current?.focus(); }, []);

  const handleKey = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => { window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey); }, [handleKey]);

  return (
    <motion.div
      role="dialog" aria-modal="true" aria-label="تم الاشتراك بنجاح"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full rounded-t-[32px] overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Hero */}
        <div className="relative pt-14 pb-9 px-6 flex flex-col items-center overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(34,197,94,0.13) 0%, transparent 65%)' }}>

          {/* Shimmer */}
          <motion.div aria-hidden
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut', repeatDelay: 2.2 }}
            style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.07), transparent)', pointerEvents: 'none' }}
          />

          {/* Check + particles */}
          <div className="relative mb-5">
            {PARTICLES.map(p => (
              <motion.span key={p.id} aria-hidden
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.dist,
                  scale: 0,
                }}
                transition={{ delay: 0.18, duration: 0.65, ease: 'easeOut' }}
                style={{ position: 'absolute', top: '50%', left: '50%',
                  width: p.size, height: p.size, borderRadius: '50%',
                  background: p.color, pointerEvents: 'none', transform: 'translate(-50%,-50%)' }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, rotate: -18 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 440, damping: 22, delay: 0.1 }}
              className="w-[76px] h-[76px] rounded-full flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.13)', border: '2px solid rgba(34,197,94,0.42)',
                boxShadow: '0 0 28px rgba(34,197,94,0.22)' }}
            >
              <CheckIcon size={36} />
            </motion.div>
          </div>

          <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
            className="font-black text-center mb-1"
            style={{ fontSize: 'var(--text-xl)', color: 'var(--text-main)' }}>
            تم الاشتراك بنجاح! 🎉
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 }}
            className="text-center" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            أهلاً بك في عائلة الوسيط
          </motion.p>
        </div>

        {/* Cards */}
        <div className="px-5 pb-4 space-y-3">
          <motion.div variants={cardVariants} initial="hidden" animate="show" custom={0}
            className="rounded-[20px] p-4"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <p className="font-black tracking-widest uppercase mb-3"
              style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>تفاصيل الاشتراك</p>
            <div className="space-y-3">
              <Row icon="👤" label="المشترك"          value={data.userName} />
              <Row icon="🤝" label="الوسيط"           value={data.mediatorName} />
              <Row icon={<LoveCoin size={14} />} label="العملات المدفوعة" value={data.coins.toLocaleString('ar-TN')} />
            </div>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="show" custom={1}
            className="rounded-[20px] p-4"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.22)' }}>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.52, duration: 0.4, ease: 'easeOut' }}
              style={{ height: 1, background: 'rgba(34,197,94,0.2)', transformOrigin: 'left', marginBottom: 12 }} />
            <div className="space-y-3">
              <Row icon={<ClockIcon />}  label="تاريخ الاشتراك"
                value={`${fmt(data.subscribedAt)} — ${fmtTime(data.subscribedAt)}`} valueColor="#22c55e" />
              <Row icon={<ShieldIcon />} label="صالح حتى" value={fmt(data.expiresAt)} valueColor="#22c55e" />
            </div>
          </motion.div>
        </div>

        {/* Close */}
        <motion.div className="px-5 pb-10 pt-2"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
          <motion.button ref={btnRef} whileTap={{ scale: 0.97 }} onClick={onClose}
            className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #800020, var(--color-primary))',
              boxShadow: '0 8px 24px var(--shadow-red-glow)', fontSize: 'var(--text-sm)' }}>
            👑 عودة للوسطاء
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}