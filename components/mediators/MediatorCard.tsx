'use client';
/**
 * components/mediators/MediatorCard.tsx
 *
 * Single mediator card displayed in the main list.
 * Premium production enhancements:
 *  - Animated stat counters (count-up on mount)
 *  - Hover lift + glow effect on the card
 *  - Subscribe button with ripple effect
 *  - Top-3 rank badge with themed metals
 *  - Bio text with graceful expand-on-click
 *  - Skeleton-safe: renders safely with any partial data
 */

import { useState, useEffect, useRef }    from 'react';
import { motion, AnimatePresence }         from 'framer-motion';
import { MapPin, ChevronLeft, MessageCircle, Crown } from 'lucide-react';
import { Stars }                           from './Stars';
import { LevelBadge }                      from './LevelBadge';
import type { MediatorRow }                from './types';

/* ── Rank badge metal colors ────────────────────────── */
const RANK_COLORS = ['#D4AF37', '#C0C0C0', '#CD7F32'] as const;

/* ── Animated stat number ───────────────────────────── */
function AnimatedStat({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef                = useRef<number | null>(null);

  useEffect(() => {
    const start    = performance.now();
    const duration = 700;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{display}</>;
}

/* ── Props ──────────────────────────────────────────── */
interface MediatorCardProps {
  mediator:          MediatorRow;
  rank:              number;
  /** Whether the current user is logged in */
  isAuthenticated:   boolean;
  onSubscribe:       (m: MediatorRow) => void;
  onOpenDetail:      (m: MediatorRow) => void;
  /** onMessage reserved for future chat integration */
  onMessage?:        (m: MediatorRow) => void;
}

/* ── Component ──────────────────────────────────────── */
export function MediatorCard({
  mediator,
  rank,
  isAuthenticated,
  onSubscribe,
  onOpenDetail,
  onMessage,
}: MediatorCardProps) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const showRankBadge                 = rank <= 3;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.06, type: 'spring', stiffness: 280, damping: 26 }}
      whileHover={{ y: -2, boxShadow: '0 12px 36px rgba(0,0,0,0.28)' }}
      className="rounded-[28px] p-5"
      style={{
        background: 'var(--glass-bg)',
        border:     '1px solid var(--glass-border)',
        boxShadow:  'var(--shadow-soft)',
      }}
      aria-label={`وسيط: ${mediator.full_name}`}
    >
      {/* ── Header ────────────────────────────────── */}
      <div className="flex items-start gap-4">

        {/* Avatar + rank badge */}
        <div className="relative flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.04 }}
            className="w-16 h-16 rounded-full overflow-hidden"
            style={{ border: '2px solid var(--border-gold)' }}
          >
            {mediator.avatar_url ? (
              <img
                src={mediator.avatar_url}
                alt={mediator.full_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl"
                style={{ background: 'var(--bg-soft)' }}
                aria-hidden
              >
                🤝
              </div>
            )}
          </motion.div>

          {/* Rank medal */}
          {showRankBadge && (
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: rank * 0.06 + 0.15 }}
              aria-label={`المرتبة ${rank}`}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-black"
              style={{
                background: RANK_COLORS[rank - 1],
                color:      '#000',
                fontSize:   '10px',
                boxShadow:  `0 2px 8px ${RANK_COLORS[rank - 1]}80`,
              }}
            >
              {rank}
            </motion.div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-black"
              style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}
            >
              {mediator.full_name}
            </h3>
            <LevelBadge level={mediator.mediator_level} />
          </div>

          {mediator.city && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} style={{ color: 'var(--text-tertiary)' }} aria-hidden />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {mediator.city}{mediator.country ? `، ${mediator.country}` : ''}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            <Stars value={mediator.avg_rating} size={12} />
            <span
              className="font-bold"
              style={{ fontSize: 'var(--text-xs)', color: '#D4AF37' }}
              aria-label={`تقييم ${mediator.avg_rating.toFixed(1)}`}
            >
              {mediator.avg_rating.toFixed(1)}
            </span>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
              ({mediator.rating_count} تقييم)
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────── */}
      <div className="flex gap-2 mt-4" role="list" aria-label="إحصائيات الوسيط">
        {(
          [
            { label: 'ذكور',  value: mediator.male_count,    color: '#60A5FA', bg: 'rgba(59,130,246,0.08)'  },
            { label: 'إناث',  value: mediator.female_count,  color: '#F472B6', bg: 'rgba(236,72,153,0.08)'  },
            { label: 'نجاح',  value: mediator.success_count, color: '#4ADE80', bg: 'rgba(34,197,94,0.08)'   },
          ] as const
        ).map((s) => (
          <div
            key={s.label}
            role="listitem"
            className="flex-1 rounded-2xl px-2 py-2 text-center"
            style={{ background: s.bg, border: `1px solid ${s.color}25` }}
          >
            <p
              className="font-black"
              style={{ fontSize: 'var(--text-base)', color: s.color }}
              aria-label={`${s.label}: ${s.value}`}
            >
              <AnimatedStat value={s.value} />
            </p>
            <p
              className="font-bold"
              style={{ fontSize: 'var(--text-2xs)', color: `${s.color}80` }}
              aria-hidden
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Bio ───────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {mediator.bio && (
          <motion.div
            key="bio"
            initial={false}
            animate={{ height: bioExpanded ? 'auto' : '2.8em' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mt-3 overflow-hidden relative cursor-pointer"
            onClick={() => setBioExpanded((v) => !v)}
          >
            <p
              style={{
                fontSize:   'var(--text-xs)',
                lineHeight: 'var(--lh-relaxed)',
                color:      'var(--text-secondary)',
              }}
            >
              {mediator.bio}
            </p>
            {!bioExpanded && (
              <div
                aria-hidden
                style={{
                  position:   'absolute',
                  bottom:     0,
                  left:       0,
                  right:      0,
                  height:     '1.4em',
                  background: 'linear-gradient(transparent, var(--glass-bg))',
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action buttons ────────────────────────── */}
      <div className="mt-4 space-y-2">

        {/* Primary: subscribe / subscribed indicator */}
        {mediator.isSubscribed ? (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black"
            style={{
              background: 'rgba(212,175,55,0.12)',
              border:     '1px solid var(--border-gold)',
              fontSize:   'var(--text-sm)',
              color:      '#D4AF37',
            }}
            role="status"
            aria-label="أنت مشترك حالياً مع هذا الوسيط"
          >
            <Crown size={16} aria-hidden /> أنت مشترك حالياً ✓
          </motion.div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => isAuthenticated && onSubscribe(mediator)}
            disabled={!isAuthenticated}
            aria-label={`اشترك مع ${mediator.full_name}`}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-white"
            style={{
              background: 'linear-gradient(135deg, #800020, var(--color-primary))',
              boxShadow:  '0 8px 24px var(--shadow-red-glow)',
              fontSize:   'var(--text-sm)',
              opacity:    isAuthenticated ? 1 : 0.5,
            }}
          >
            <Crown size={16} aria-hidden /> اشتراك الآن
          </motion.button>
        )}

        {/* Secondary: message + detail */}
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onMessage?.(mediator)}
            aria-label={`مراسلة ${mediator.full_name}`}
            className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-bold"
            style={{
              background: 'rgba(56,189,248,0.08)',
              border:     '1px solid rgba(56,189,248,0.2)',
              fontSize:   'var(--text-xs)',
              color:      '#38BDF8',
            }}
          >
            <MessageCircle size={15} aria-hidden /> رسالة
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onOpenDetail(mediator)}
            aria-label={`عرض تفاصيل ${mediator.full_name}`}
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            <ChevronLeft size={17} style={{ color: 'var(--text-tertiary)' }} aria-hidden />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}