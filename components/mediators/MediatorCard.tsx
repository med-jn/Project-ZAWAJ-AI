'use client';
/**
 * components/mediators/MediatorCard.tsx
 * - LevelBadge من @/components/gems (يعتمد على total_subscribers)
 * - لا إيموجي — كل الأيقونات من Lucide عبر .icon-wrap
 */

import { useState, useEffect, useRef } from 'react';
import { motion }                       from 'framer-motion';
import { MapPin, ChevronLeft, MessageCircle, Crown } from 'lucide-react';
import { LevelBadge }   from '@/components/gems';
import { Icon }         from './Icon';
import { Stars }        from './Stars';
import type { MediatorRow } from './types';

const RANK_COLORS = ['#D4AF37', '#C0C0C0', '#CD7F32'] as const;

/* ── Animated counter ─────────────────────────────── */
function AnimatedStat({ value }: { value: number }) {
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now(); const dur = 700;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setN(Math.round((1 - Math.pow(2, -10 * p)) * value));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);
  return <>{n}</>;
}

interface Props {
  mediator:        MediatorRow;
  rank:            number;
  isAuthenticated: boolean;
  onSubscribe:     (m: MediatorRow) => void;
  onOpenDetail:    (m: MediatorRow) => void;
  onMessage?:      (m: MediatorRow) => void;
}

export function MediatorCard({ mediator, rank, isAuthenticated, onSubscribe, onOpenDetail, onMessage }: Props) {
  const [bioExpanded, setBioExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(rank * 0.06, 0.4), type: 'spring', stiffness: 280, damping: 26 }}
      whileHover={{ y: -2 }}
      className="rounded-[28px] p-5"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}
    >
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <motion.div whileHover={{ scale: 1.04 }}
            className="w-16 h-16 rounded-full overflow-hidden"
            style={{ border: '2px solid var(--border-gold)' }}>
            {mediator.avatar_url
              ? <img src={mediator.avatar_url} alt={mediator.full_name} className="w-full h-full object-cover" loading="lazy" />
              : <div className="w-full h-full flex items-center justify-center icon-wrap"
                  style={{ background: 'var(--bg-soft)' }}>
                  <Icon i={Crown} size={26} color="var(--text-tertiary)" />
                </div>}
          </motion.div>

          {/* Rank badge */}
          {rank <= 3 && (
            <motion.div
              initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: Math.min(rank * 0.06 + 0.15, 0.5) }}
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
            {/* ── البادج الجديد من نظام الجواهر ── */}
            <LevelBadge subscribers={mediator.total_subscribers} size="sm" />
          </div>

          {mediator.city && (
            <div className="flex items-center gap-1 mt-1 icon-wrap">
              <Icon i={MapPin} size={11} color="var(--text-tertiary)" />
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

      {/* ── Stats ──────────────────────────────────── */}
      <div className="flex gap-2 mt-4">
        {([
          { label: 'ذكور', value: mediator.male_count,       color: '#60A5FA', bg: 'rgba(59,130,246,0.08)'  },
          { label: 'إناث', value: mediator.female_count,     color: '#F472B6', bg: 'rgba(236,72,153,0.08)'  },
          { label: 'نجاح', value: mediator.success_count,    color: '#4ADE80', bg: 'rgba(34,197,94,0.08)'   },
        ] as const).map(s => (
          <div key={s.label} className="flex-1 rounded-2xl px-2 py-2 text-center"
            style={{ background: s.bg, border: `1px solid ${s.color}25` }}>
            <p className="font-black" style={{ fontSize: 'var(--text-base)', color: s.color }}>
              <AnimatedStat value={s.value} />
            </p>
            <p className="font-bold" style={{ fontSize: 'var(--text-2xs)', color: `${s.color}80` }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Bio expandable ─────────────────────────── */}
      {mediator.bio && (
        <motion.div
          animate={{ height: bioExpanded ? 'auto' : '2.8em' }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          className="mt-3 overflow-hidden relative cursor-pointer"
          onClick={() => setBioExpanded(v => !v)}>
          <p style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-secondary)' }}>
            {mediator.bio}
          </p>
          {!bioExpanded && (
            <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.4em',
              background: 'linear-gradient(transparent, var(--glass-bg))' }} />
          )}
        </motion.div>
      )}

      {/* ── Actions ────────────────────────────────── */}
      <div className="mt-4 space-y-2">
        {mediator.isSubscribed ? (
          <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black icon-wrap"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid var(--border-gold)',
              fontSize: 'var(--text-sm)', color: '#D4AF37' }}>
            <Icon i={Crown} size={16} color="#D4AF37" /> أنت مشترك حالياً ✓
          </motion.div>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => isAuthenticated && onSubscribe(mediator)}
            disabled={!isAuthenticated}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-white icon-wrap"
            style={{ background: 'linear-gradient(135deg, #800020, var(--color-primary))',
              boxShadow: '0 8px 24px var(--shadow-red-glow)', fontSize: 'var(--text-sm)',
              opacity: isAuthenticated ? 1 : 0.5 }}>
            <Icon i={Crown} size={16} color="#fff" /> اشتراك الآن
          </motion.button>
        )}

        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => onMessage?.(mediator)}
            className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-bold icon-wrap"
            style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
              fontSize: 'var(--text-xs)', color: '#38BDF8' }}>
            <Icon i={MessageCircle} size={15} color="#38BDF8" /> رسالة
          </motion.button>

          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => onOpenDetail(mediator)}
            className="w-11 h-11 rounded-2xl flex items-center justify-center icon-wrap"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <Icon i={ChevronLeft} size={17} color="var(--text-tertiary)" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}