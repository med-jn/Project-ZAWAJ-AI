'use client';
/**
 * components/mediators/MediatorCard.tsx
 *
 * التحديثات:
 * - إحصائيات واضحة: ذكور/إناث النشطون + الاشتراكات الكلية
 * - أيقونات WhatsApp و TikTok للتواصل المباشر
 * - النبذة نُقلت إلى الصفحة التفصيلية (أنظف وأخف)
 */

import { useState, useEffect, useRef } from 'react';
import { motion }          from 'framer-motion';
import { MapPin, ChevronLeft, MessageCircle, Crown } from 'lucide-react';
import { LevelBadge }      from '@/components/gems';
import { Icon }            from './Icon';
import { Stars }           from './Stars';
import type { MediatorRow } from './types';

const RANK_COLORS = ['#D4AF37', '#C0C0C0', '#CD7F32'] as const;

/* ── SVG icons for social platforms ───────────────── */
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.27 8.27 0 004.84 1.55V6.84a4.85 4.85 0 01-1.07-.15z"/>
    </svg>
  );
}

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

export function MediatorCard({
  mediator, rank, isAuthenticated, onSubscribe, onOpenDetail, onMessage,
}: Props) {

  /* ── WhatsApp deep link ── */
  const handleWhatsApp = () => {
    if (!mediator.whatsapp) return;
    const phone = mediator.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  /* ── TikTok deep link ── */
  const handleTikTok = () => {
    if (!mediator.tiktok) return;
    const user = mediator.tiktok.replace('@', '');
    window.open(`https://www.tiktok.com/@${user}`, '_blank');
  };

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
              ? <img src={mediator.avatar_url} alt={mediator.full_name}
                  className="w-full h-full object-cover" loading="lazy" />
              : <div className="w-full h-full flex items-center justify-center icon-wrap"
                  style={{ background: 'var(--bg-soft)' }}>
                  <Icon i={Crown} size={26} color="var(--text-tertiary)" />
                </div>}
          </motion.div>

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
          {/* الاسم + البادج */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black" style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
              {mediator.full_name}
            </h3>
            <LevelBadge subscribers={mediator.total_subscribers} size="sm" />
          </div>

          {/* المدينة */}
          {mediator.city && (
            <div className="flex items-center gap-1 mt-1 icon-wrap">
              <Icon i={MapPin} size={11} color="var(--text-tertiary)" />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {mediator.city}{mediator.country ? `، ${mediator.country}` : ''}
              </span>
            </div>
          )}

          {/* التقييم */}
          <div className="flex items-center gap-2 mt-1.5">
            <Stars value={mediator.avg_rating} size={12} />
            <span className="font-bold" style={{ fontSize: 'var(--text-xs)', color: '#D4AF37' }}>
              {Number(mediator.avg_rating).toFixed(1)}
            </span>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
              ({mediator.rating_count} تقييم)
            </span>
          </div>

          {/* أيقونات التواصل الاجتماعي */}
          {(mediator.whatsapp || mediator.tiktok) && (
            <div className="flex items-center gap-2 mt-2">
              {mediator.whatsapp && (
                <motion.button whileTap={{ scale: 0.88 }} onClick={handleWhatsApp}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)',
                    color: '#25D166' }}
                  title="WhatsApp">
                  <WhatsAppIcon size={14} />
                </motion.button>
              )}
              {mediator.tiktok && (
                <motion.button whileTap={{ scale: 0.88 }} onClick={handleTikTok}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text-secondary)' }}
                  title="TikTok">
                  <TikTokIcon size={14} />
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats — 3 عدادات واضحة ─────────────────── */}
      <div className="flex gap-2 mt-4">
        {/* ذكور نشطون */}
        <div className="flex-1 rounded-2xl px-2 py-2 text-center"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p className="font-black" style={{ fontSize: 'var(--text-base)', color: '#60A5FA' }}>
            <AnimatedStat value={mediator.male_count} />
          </p>
          <p style={{ fontSize: 'var(--text-2xs)', color: 'rgba(96,165,250,0.6)', fontWeight: 700 }}>♂ ذكور</p>
        </div>

        {/* إناث نشطات */}
        <div className="flex-1 rounded-2xl px-2 py-2 text-center"
          style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)' }}>
          <p className="font-black" style={{ fontSize: 'var(--text-base)', color: '#F472B6' }}>
            <AnimatedStat value={mediator.female_count} />
          </p>
          <p style={{ fontSize: 'var(--text-2xs)', color: 'rgba(244,114,182,0.6)', fontWeight: 700 }}>♀ إناث</p>
        </div>

        {/* إجمالي الاشتراكات — تصاعدي لا ينقص */}
        <div className="flex-1 rounded-2xl px-2 py-2 text-center"
          style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
          <p className="font-black" style={{ fontSize: 'var(--text-base)', color: '#D4AF37' }}>
            <AnimatedStat value={mediator.total_subscribers} />
          </p>
          <p style={{ fontSize: 'var(--text-2xs)', color: 'rgba(212,175,55,0.6)', fontWeight: 700 }}>
            إجمالي
          </p>
        </div>
      </div>

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