'use client';
/**
 * 📁 components/cards/usercard.tsx — ZAWAJ AI
 * ✅ يمين = إعجاب | يسار = تجاهل
 * ✅ بادجات مباشرة من wallets (bronze/silver/gold/diamond)
 * ✅ أزرار كبسولة بـ CSS variables
 * ✅ خصم النقاط عبر EconomyService
 */

import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Heart, X, Eye, MapPin } from 'lucide-react';
import { supabase }    from '@/lib/supabase/client';
import { LevelBadge }  from '@/components/badges';
import { sendLike }    from '@/lib/services/EconomyService';

// ── نوع البادج المسموح به ──────────────────────────────────────
type BadgeType = 'bronze' | 'silver' | 'gold' | 'diamond';
const VALID_BADGES: BadgeType[] = ['bronze', 'silver', 'gold', 'diamond'];
const toBadge = (v?: string): BadgeType | null =>
  VALID_BADGES.includes(v as BadgeType) ? (v as BadgeType) : null;

// ══════════════════════════════════════════════════════════════
//  Props
// ══════════════════════════════════════════════════════════════
export interface UserCardData {
  id:                   string;
  name:                 string;
  age:                  number;
  gender?:              'male' | 'female';
  city?:                string;
  mainPhoto:            string;
  prefersBlur?:         boolean;
  badge_type?:          string;   // من wallets: none|bronze|silver|gold|diamond
  religious_commitment?: number;
  currentUser?:         { id: string } | null;
}

interface UserCardProps {
  userData:      UserCardData;
  onNext:        () => void;
  onViewProfile: (userId: string) => void;
}

// ══════════════════════════════════════════════════════════════
//  المكوّن
// ══════════════════════════════════════════════════════════════
export default function UserCard({ userData: u, onNext, onViewProfile }: UserCardProps) {
  const [likeFlash, setLikeFlash] = useState(false);
  const [passFlash, setPassFlash] = useState(false);
  const [busy,      setBusy]      = useState(false);
  const hasViewed = useRef(false);

  const x      = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [12, -12]);
  const cardOp = useTransform(x, [-280, -90, 0, 90, 280], [0, 1, 1, 1, 0]);
  const likeOp = useTransform(x, [0, 120], [0, 0.4]);
  const passOp = useTransform(x, [-120, 0], [0.4, 0]);

  // ── تسجيل الفعل + حذف المعاكس ──────────────────────────────
  const act = useCallback(async (action: 'like' | 'pass' | 'view') => {
    if (!u.currentUser?.id) return;
    if (action !== 'view') setBusy(true);
    try {
      const opposite = action === 'like' ? 'pass' : action === 'pass' ? 'like' : null;
      if (opposite) {
        await supabase.from('likes')
          .delete()
          .eq('from_user', u.currentUser.id)
          .eq('to_user',   u.id)
          .eq('action',    opposite);
      }
      await supabase.from('likes').upsert(
        { from_user: u.currentUser.id, to_user: u.id, action },
        { onConflict: 'from_user,to_user,action', ignoreDuplicates: true }
      );
    } catch (e) { console.error('[UserCard]', e); }
    finally   { if (action !== 'view') setBusy(false); }
  }, [u]);

  // ── سوايب ─────────────────────────────────────────────────
  const swipeTo = useCallback(async (dir: 1 | -1) => {
    const action = dir === 1 ? 'like' : 'pass';
    await act(action);
    if (action === 'like' && u.currentUser?.id)
      sendLike(u.currentUser.id).catch(() => {});
    animate(x, dir * 700, { duration: 0.27 });
    setTimeout(() => { x.set(0); onNext(); }, 305);
  }, [act, x, onNext, u.currentUser]);

  const onDragEnd = (_: any, info: any) => {
    if      (info.offset.x >  105) { flash('like'); swipeTo(1);  }
    else if (info.offset.x < -105) { flash('pass'); swipeTo(-1); }
    else animate(x, 0, { type: 'spring', stiffness: 360, damping: 28 });
  };

  const flash = (t: 'like' | 'pass') => {
    if (t === 'like') { setLikeFlash(true); setTimeout(() => setLikeFlash(false), 400); }
    else              { setPassFlash(true); setTimeout(() => setPassFlash(false), 400); }
  };

  // تسجيل الزيارة عند الظهور
  if (!hasViewed.current && u.currentUser) {
    hasViewed.current = true;
    act('view');
  }

  const badge = toBadge(u.badge_type);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', paddingBottom: 'var(--nav-h)' }}>

      {/* ═══ البطاقة ═══ */}
      <motion.div
        style={{ x, rotate, opacity: cardOp }}
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.48}
        onDragEnd={onDragEnd}
        className="absolute inset-0"
      >
        {/* الصورة */}
        <img
          src={u.mainPhoto || '/default-avatar.png'} alt={u.name} draggable={false}
          className="absolute inset-0 w-full h-full object-cover select-none"
          style={{
            filter:    u.prefersBlur ? 'blur(24px)' : 'none',
            transform: u.prefersBlur ? 'scale(1.1)' : 'none',
          }}
        />

        {/* تدرج أسفل */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.35) 40%, transparent 70%)',
        }} />

        {/* overlay إعجاب (أخضر، يمين) */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to left, rgba(34,197,94,0.55), transparent 55%)',
          opacity: likeOp,
        }} />

        {/* overlay تجاهل (أحمر، يسار) */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to right, rgba(164,22,26,0.55), transparent 55%)',
          opacity: passOp,
        }} />

        {/* مؤشر إعجاب */}
        <motion.div style={{
          position: 'absolute', top: 'var(--sp-8)', right: 'var(--sp-6)',
          opacity: likeOp, pointerEvents: 'none',
          border: '2.5px solid #22c55e', borderRadius: 'var(--radius-md)',
          padding: 'var(--sp-1) var(--sp-4)', transform: 'rotate(-10deg)',
        }}>
          <span style={{ color: '#22c55e', fontWeight: 900, fontSize: 'var(--text-lg)', letterSpacing: '0.08em' }}>
            إعجاب ❤️
          </span>
        </motion.div>

        {/* مؤشر تجاهل */}
        <motion.div style={{
          position: 'absolute', top: 'var(--sp-8)', left: 'var(--sp-6)',
          opacity: passOp, pointerEvents: 'none',
          border: '2.5px solid var(--color-accent)', borderRadius: 'var(--radius-md)',
          padding: 'var(--sp-1) var(--sp-4)', transform: 'rotate(10deg)',
        }}>
          <span style={{ color: 'var(--color-accent)', fontWeight: 900, fontSize: 'var(--text-lg)', letterSpacing: '0.08em' }}>
            تجاوز ✕
          </span>
        </motion.div>

        {/* الاسم + البادج + العمر + المدينة */}
        <div style={{
          position: 'absolute',
          right: 'var(--sp-5)', left: 'var(--sp-5)',
          bottom: 'calc(var(--nav-h) + 5.5rem)',
          direction: 'rtl', pointerEvents: 'none',
        }}>
          {/* اسم + بادج */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 'var(--sp-2)' }}>
            <h2 style={{
              color: '#fff', fontWeight: 900, margin: 0,
              fontSize: 'var(--text-2xl)',
              textShadow: '0 2px 16px rgba(0,0,0,0.9)',
              lineHeight: 'var(--lh-tight)',
            }}>
              {u.name}
            </h2>
            {badge && <LevelBadge type={badge} size="text-[10px]" />}
          </div>

          {/* عمر + مدينة */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
            {!!u.age && (
              <span style={{
                color: 'rgba(255,255,255,0.95)', fontWeight: 700,
                fontSize: 'var(--text-md)',
                textShadow: '0 1px 8px rgba(0,0,0,0.8)',
              }}>
                {u.age} سنة
              </span>
            )}
            {u.city && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
                color: 'rgba(255,255,255,0.85)', fontSize: 'var(--text-sm)',
                textShadow: '0 1px 8px rgba(0,0,0,0.8)',
              }}>
                <MapPin size={13} style={{ flexShrink: 0 }} />
                {u.city}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ أزرار التفاعل ════════════════════════════════════
          دوائر كاملة — أحجام بـ CSS variables
          إعجاب (يمين، أكبر) | ملف (وسط) | تجاهل (يسار)
      ═══════════════════════════════════════════════════════ */}
      <div style={{
        position: 'fixed', left: 0, right: 0, zIndex: 180,
        bottom: 'calc(var(--nav-h) + var(--sp-4))',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 'var(--sp-5)',
        direction: 'rtl',
      }}>

        {/* إعجاب — الأكبر، glow أحمر، نبضة عند الضغط */}
        <CardBtn
          label="إعجاب"
          icon={<Heart size={22} fill={likeFlash ? '#fff' : 'none'} strokeWidth={2} color="#fff" />}
          size="var(--btn-h-lg)"
          bg={likeFlash ? 'var(--color-primary)' : 'linear-gradient(145deg,var(--color-primary-soft),rgba(164,22,26,0.55))'}
          border="var(--color-primary)"
          shadow={likeFlash
            ? '0 0 0 5px var(--color-primary-xsoft), 0 8px 24px var(--shadow-red-glow)'
            : '0 4px 16px var(--shadow-red-glow)'}
          busy={busy}
          onClick={() => { flash('like'); swipeTo(1); }}
        />

        {/* ملف — ذهبي هادئ */}
        <CardBtn
          label="ملف"
          icon={<Eye size={15} color="var(--color-gold)" />}
          size="var(--btn-h)"
          bg="rgba(212,175,55,0.08)"
          border="var(--border-gold)"
          shadow="none"
          onClick={() => onViewProfile(u.id)}
        />

        {/* تجاهل — شفاف */}
        <CardBtn
          label="تجاهل"
          icon={<X size={17} strokeWidth={2.5} color="var(--text-secondary)" />}
          size="var(--btn-h)"
          bg={passFlash ? 'var(--glass-bg)' : 'rgba(255,255,255,0.05)'}
          border="var(--glass-border)"
          shadow="none"
          busy={busy}
          onClick={() => { flash('pass'); swipeTo(-1); }}
        />

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  زر البطاقة — دائرة كاملة بـ CSS variables
// ══════════════════════════════════════════════════════════════
function CardBtn({
  label, icon, size, bg, border, shadow, busy, onClick,
}: {
  label:   string;
  icon:    React.ReactNode;
  size:    string;   // CSS variable: 'var(--btn-h)' | 'var(--btn-h-lg)'
  bg:      string;
  border:  string;
  shadow:  string;
  busy?:   boolean;
  onClick: () => void;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 'var(--sp-1)',
    }}>
      <motion.button
        whileTap={{ scale: 0.74 }}
        whileHover={{ scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        onClick={onClick}
        disabled={busy}
        style={{
          width:  size,
          height: size,
          borderRadius: 'var(--radius-full)',   /* ✅ دائرة كاملة */
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background:  bg,
          border:      `1.5px solid ${border}`,
          boxShadow:   shadow,
          cursor:      busy ? 'not-allowed' : 'pointer',
          opacity:     busy ? 0.35 : 1,
          outline:     'none',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition:  'background 0.18s, box-shadow 0.18s',
          flexShrink: 0,
        }}
      >
        {icon}
      </motion.button>
      <span style={{
        fontSize:      'var(--text-2xs)',
        fontWeight:    700,
        color:         'rgba(255,255,255,0.5)',
        letterSpacing: '0.04em',
        userSelect:    'none',
      }}>
        {label}
      </span>
    </div>
  );
}