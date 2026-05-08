'use client';
/**
 * components/mediators/MediatorCard.tsx
 * بطاقة الوسيط — animated stats + bio expand + rank badge + hover lift
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence }      from 'framer-motion';
import { Stars }                        from './Stars';
import { LevelBadge }                  from './LevelBadge';
import type { MediatorRow }             from './types';

/* ── SVG icons ────────────────────────── */
function MapPinIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block', flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"
        style={{ fill: 'rgba(170,170,170,0.15)', stroke: 'var(--text-tertiary)', strokeWidth: '2px' }} />
      <circle cx="12" cy="10" r="3"
        style={{ fill: 'var(--text-tertiary)', stroke: 'none' }} />
    </svg>
  );
}

function ChevronLeftIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <polyline points="15 18 9 12 15 6"
        style={{ fill: 'none', stroke: 'var(--text-tertiary)', strokeWidth: '2px', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
    </svg>
  );
}

function MessageIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        style={{ fill: 'rgba(56,189,248,0.12)', stroke: '#38BDF8', strokeWidth: '2px', strokeLinejoin: 'round' }} />
    </svg>
  );
}

/* ── Animated counter ─────────────────── */
function AnimatedStat({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const dur   = 700;
    const tick  = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setDisplay(Math.round(e * value));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);
  return <>{display}</>;
}

const RANK_COLORS = ['#D4AF37', '#C0C0C0', '#CD7F32'] as const;

interface MediatorCardProps {
  mediator:        MediatorRow;
  rank:            number;
  isAuthenticated: boolean;
  onSubscribe:     (m: MediatorRow) => void;
  onOpenDetail:    (m: MediatorRow) => void;
  onMessage?:      (m: MediatorRow) => void;
}

export function MediatorCard({ mediator, rank, isAuthenticated, onSubscribe, onOpenDetail, onMessage }: MediatorCardProps) {
  const [bioExpanded, setBioExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(rank * 0.06, 0.4), type: 'spring', stiffness: 280, damping: 26 }}
      whileHover={{ y: -2 }}
      className="rounded-[28px] p-5"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}
      aria-label={`وسيط: ${mediator.full_name}`}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <motion.div whileHover={{ scale: 1.04 }}
            className="w-16 h-16 rounded-full overflow-hidden"
            style={{ border: '2px solid var(--border-gold)' }}>
            {mediator.avatar_url
              ? <img src={mediator.avatar_url} alt={mediator.full_name} className="w-full h-full object-cover" loading="lazy" />
              : <div className="w-full h-full flex items-center justify-center text-2xl"
                  style={{ background: 'var(--bg-soft)' }} aria-hidden>🤝</div>}
          </motion.div>

          {rank <= 3 && (
            <motion.div
              initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: Math.min(rank * 0.06 + 0.15, 0.5) }}
              aria-label={`المرتبة ${rank}`}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-black"
              style={{ background: RANK_COLORS[rank - 1], color: '#000', fontSize: '10px',
                boxShadow: `0 2px 8px ${RANK_COLORS[rank - 1]}80` }}>
              {rank}
            </motion.div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black" style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
              {mediator.full_name}
            </h3>
            <LevelBadge level={mediator.mediator_level} />
          </div>

          {mediator.city && (
            <div className="flex items-center gap-1 mt-1">
              <MapPinIcon />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {mediator.city}{mediator.country ? `، ${mediator.country}` : ''}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            <Stars value={mediator.avg_rating} size={12} />
            <span className="font-bold" style={{ fontSize: 'var(--text-xs)', color: '#D4AF37' }}>
              {Number(mediator.avg_rating).toFixed(1)}
            </span>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
              ({mediator.rating_count} تقييم)
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2 mt-4" role="list" aria-label="إحصائيات">
        {([
          { label: 'ذكور', value: mediator.male_count,    color: '#60A5FA', bg: 'rgba(59,130,246,0.08)'  },
          { label: 'إناث', value: mediator.female_count,  color: '#F472B6', bg: 'rgba(236,72,153,0.08)'  },
          { label: 'نجاح', value: mediator.success_count, color: '#4ADE80', bg: 'rgba(34,197,94,0.08)'   },
        ] as const).map(s => (
          <div key={s.label} role="listitem"
            className="flex-1 rounded-2xl px-2 py-2 text-center"
            style={{ background: s.bg, border: `1px solid ${s.color}25` }}>
            <p className="font-black" style={{ fontSize: 'var(--text-base)', color: s.color }}>
              <AnimatedStat value={s.value} />
            </p>
            <p className="font-bold" style={{ fontSize: 'var(--text-2xs)', color: `${s.color}80` }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bio — expandable */}
      {mediator.bio && (
        <motion.div
          animate={{ height: bioExpanded ? 'auto' : '2.8em' }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          className="mt-3 overflow-hidden relative cursor-pointer"
          onClick={() => setBioExpanded(v => !v)}
        >
          <p style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-secondary)' }}>
            {mediator.bio}
          </p>
          {!bioExpanded && (
            <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.4em',
              background: 'linear-gradient(transparent, var(--glass-bg))' }} />
          )}
        </motion.div>
      )}

      {/* Actions */}
      <div className="mt-4 space-y-2">
        {mediator.isSubscribed ? (
          <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid var(--border-gold)',
              fontSize: 'var(--text-sm)', color: '#D4AF37' }}
            role="status" aria-label="أنت مشترك حالياً">
            👑 أنت مشترك حالياً ✓
          </motion.div>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => isAuthenticated && onSubscribe(mediator)}
            disabled={!isAuthenticated}
            aria-label={`اشترك مع ${mediator.full_name}`}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-white"
            style={{ background: 'linear-gradient(135deg, #800020, var(--color-primary))',
              boxShadow: '0 8px 24px var(--shadow-red-glow)', fontSize: 'var(--text-sm)',
              opacity: isAuthenticated ? 1 : 0.5 }}>
            👑 اشتراك الآن
          </motion.button>
        )}

        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => onMessage?.(mediator)}
            aria-label="رسالة"
            className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-bold"
            style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
              fontSize: 'var(--text-xs)', color: '#38BDF8' }}>
            <MessageIcon /> رسالة
          </motion.button>

          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => onOpenDetail(mediator)}
            aria-label="تفاصيل"
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <ChevronLeftIcon />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}