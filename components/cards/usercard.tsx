'use client';
/**
 * 📁 components/cards/usercard.tsx
 * ZAWAJ AI — نسخة مبسّطة
 * ✅ صورة + اسم + عمر + مدينة + معلومات أساسية
 * ✅ سوايب يعمل بحرية تامة (لا سكرول داخلي مُعارِض)
 * ✅ زر "عرض الملف" بدل حظر/إبلاغ
 */

import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Heart, X, MessageCircle, Eye } from 'lucide-react';
import { supabase }   from '@/lib/supabase/client';
import { AutoBadge }  from '@/components/auto-badge';
import { UI_ICONS }   from '@/constants/icons-lib';

const NAV = 62;

// ── أزرار زجاجية ─────────────────────────────────────────────
type BtnType = 'like' | 'pass' | 'message' | 'view';

const GlassBtn = ({ type, size = 50, onClick, disabled, active }: {
  type: BtnType; size?: number; onClick?: () => void; disabled?: boolean; active?: boolean;
}) => {
  const [tap, setTap] = useState(false);
  const on = tap || active;
  const ic = Math.round(size * 0.37);

  const cfg: Record<BtnType, any> = {
    like:    {
      icon: (o: boolean) => <Heart size={ic} fill={o ? 'white' : 'none'} className="text-white" strokeWidth={2}/>,
      bg: ['rgba(164,22,26,0.3)', 'rgba(164,22,26,0.8)'],
      glow: ['none', '0 0 38px rgba(164,22,26,0.65)'],
      border: 'rgba(164,22,26,0.5)',
    },
    pass:    {
      icon: () => <X size={ic} strokeWidth={4} style={{ color: 'rgba(255,255,255,0.9)' }}/>,
      bg: ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)'],
      glow: ['none', 'none'],
      border: 'rgba(255,255,255,0.5)',
    },
    message: {
      icon: () => <MessageCircle size={ic} strokeWidth={3} style={{ color: '#7dd3fc' }}/>,
      bg: ['rgba(0,40,75,0.2)', 'rgba(0,40,75,0.6)'],
      glow: ['none', '0 0 34px rgba(56,189,248,0.48)'],
      border: 'rgba(56,189,248,0.5)',
    },
    view: {
      icon: () => <Eye size={ic} style={{ color: 'var(--color-primary)' }}/>,
      bg: ['rgba(212,175,55,0.1)', 'rgba(212,175,55,0.25)'],
      glow: ['none', '0 0 28px rgba(212,175,55,0.3)'],
      border: 'rgba(212,175,55,0.45)',
    },
  };

  const c = cfg[type];
  return (
    <motion.button
      onPointerDown={() => setTap(true)}
      onPointerUp={() => { setTap(false); onClick?.(); }}
      onPointerLeave={() => setTap(false)}
      disabled={disabled}
      whileTap={{ scale: 0.78 }}
      whileHover={{ scale: 1.07 }}
      transition={{ type: 'spring', stiffness: 480, damping: 20 }}
      className="flex items-center justify-center select-none outline-none flex-shrink-0"
      style={{
        width: size, height: size, borderRadius: '50%',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        background: on ? c.bg[1] : c.bg[0],
        boxShadow: on ? c.glow[1] : c.glow[0],
        border: `1.5px solid ${c.border}`,
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {c.icon(!!on)}
    </motion.button>
  );
};

// ══════════════════════════════════════════════════════════════
//  Props
// ══════════════════════════════════════════════════════════════
export interface UserCardData {
  id:                string;
  name:              string;
  age:               number;
  gender?:           'male' | 'female';
  city?:             string;
  country?:          string;
  mainPhoto:         string;
  prefersBlur?:      boolean;
  subscription_type?: string;
  religious_commitment?: number;
  currentUser?:      { id: string } | null;
}

interface UserCardProps {
  userData:      UserCardData;
  onNext:        () => void;
  onViewProfile: (userId: string) => void;
}

// ══════════════════════════════════════════════════════════════
//  المكوّن الرئيسي
// ══════════════════════════════════════════════════════════════
export default function UserCard({ userData: u, onNext, onViewProfile }: UserCardProps) {
  const [likeActive, setLikeActive] = useState(false);
  const [busy,       setBusy]       = useState(false);
  const hasViewed = useRef(false);

  // ── سوايب ─────────────────────────────────────────────────
  const x      = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const cardOp = useTransform(x, [-260, -80, 0, 80, 260], [0, 1, 1, 1, 0]);

  // ── تسجيل الفعل ──────────────────────────────────────────
  const act = useCallback(async (action: 'like' | 'pass' | 'view') => {
    if (!u.currentUser?.id) return;
    if (action !== 'view') setBusy(true);
    try {
      await supabase.from('likes').upsert(
        { from_user: u.currentUser.id, to_user: u.id, action },
        { onConflict: 'from_user,to_user,action', ignoreDuplicates: true }
      );
    } catch (e) {
      console.error('[UserCard] act:', e);
    } finally {
      if (action !== 'view') setBusy(false);
    }
  }, [u]);

  const swipeTo = useCallback(async (dir: 1 | -1) => {
    await act(dir === 1 ? 'like' : 'pass');
    animate(x, dir * 700, { duration: 0.27 });
    setTimeout(() => { x.set(0); onNext(); }, 305);
  }, [act, x, onNext]);

  const onDragEnd = (_: any, info: any) => {
    if      (info.offset.x >  105) { setLikeActive(true); setTimeout(() => setLikeActive(false), 480); swipeTo(1); }
    else if (info.offset.x < -105) swipeTo(-1);
    else animate(x, 0, { type: 'spring', stiffness: 360, damping: 28 });
  };

  // ── تسجيل view عند ظهور البطاقة ─────────────────────────
  if (!hasViewed.current && u.currentUser) {
    hasViewed.current = true;
    act('view');
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ paddingBottom: NAV }}>
      <motion.div
        style={{ x, rotate, opacity: cardOp }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.48}
        onDragEnd={onDragEnd}
        className="absolute inset-0"
      >
        {/* ═══ الصورة الكاملة ═══ */}
        <div className="absolute inset-0">
          <img
            src={u.mainPhoto || '/default-avatar.png'}
            alt={u.name}
            draggable={false}
            className={`w-full h-full object-cover select-none ${u.prefersBlur ? 'blur-2xl scale-110' : ''}`}
          />
          {/* تدرج من الأسفل */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to top, var(--bg-main) 0%, rgba(0,0,0,0.5) 45%, transparent 100%)',
          }} />
        </div>

        {/* ═══ الاسم + العمر + المدينة ═══ */}
        <div
          className="absolute left-5 right-5 z-10 pointer-events-none"
          style={{ bottom: NAV + 90 }}
          dir="rtl"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-black leading-tight" style={{
              color: '#ffffff',
              fontSize: 'calc(var(--base-font-size) * 1.75)',
              textShadow: '0 2px 20px rgba(0,0,0,0.7)',
            }}>
              {u.name}
            </h2>
            {u.subscription_type && (
              <AutoBadge value={u.subscription_type as any} isBroker={false} size="text-[10px]" />
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {u.age && (
              <span className="font-bold" style={{
                color: '#ffffff', fontSize: 'calc(var(--base-font-size) * 0.88)',
                textShadow: '0 1px 8px rgba(0,0,0,0.6)',
              }}>
                {u.age} سنة
              </span>
            )}
            {u.city && (
              <span className="flex items-center gap-1" style={{
                color: 'rgba(255,255,255,0.88)',
                fontSize: 'calc(var(--base-font-size) * 0.82)',
                textShadow: '0 1px 8px rgba(0,0,0,0.6)',
              }}>
                <span className="text-[13px]">{UI_ICONS.location()}</span>
                {u.city}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ أزرار التفاعل ═══ */}
      <div
        className="fixed left-0 right-0 z-[180] flex items-center justify-center gap-4"
        style={{ bottom: NAV + 14 }}
      >
        <GlassBtn type="like"    size={56} disabled={busy} active={likeActive}
          onClick={() => { setLikeActive(true); setTimeout(() => setLikeActive(false), 480); swipeTo(1); }}
        />
        <GlassBtn type="message" size={46} disabled={busy}
          onClick={() => onViewProfile(u.id)}
        />
        <GlassBtn type="pass"    size={46} disabled={busy} onClick={() => swipeTo(-1)} />
        <GlassBtn type="view"    size={38}
          onClick={() => onViewProfile(u.id)}
        />
      </div>
    </div>
  );
}