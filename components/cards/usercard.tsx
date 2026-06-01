'use client';
/**
 * 📁 components/cards/usercard.tsx — ZAWAJ AI
 * ✅ canAfford() — تحقق محلي فوري قبل السوايب
 * ✅ Optimistic UI — البطاقة تتحرك فوراً، الخصم في الخلفية
 * ✅ أزرار أصغر + thumbs up/down ثلاثية الأبعاد + توزيع متناسق
 */

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  motion, useMotionValue, useTransform, animate, PanInfo,
} from 'framer-motion';
import { MapPin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useGiftCoins } from '@/hooks/useGiftCoins';

export interface UserCardData {
  id:           string;
  name:         string;
  age:          number;
  gender?:      'male' | 'female';
  city?:        string;
  mainPhoto:    string;
  prefersBlur?: boolean;
  currentUser?: { id: string } | null;
}

interface UserCardProps {
  userData: UserCardData;
  onNext:   () => void;
}

export default function UserCard({ userData: u, onNext }: UserCardProps) {
  const router = useRouter();
  const { deduct, canAfford } = useGiftCoins();

  const [likeFlash, setLikeFlash] = useState(false);
  const [passFlash, setPassFlash] = useState(false);
  const [busy,      setBusy]      = useState(false);
  const hasViewed   = useRef(false);
  const isDragging  = useRef(false);

  const x      = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [16, -16]);
  const cardOp = useTransform(x, [-320, -110, 0, 110, 320], [0, 1, 1, 1, 0]);
  const likeOp = useTransform(x, [20, 140], [0, 1]);
  const passOp = useTransform(x, [-140, -20], [1, 0]);

  // ── تسجيل في likes ────────────────────────────────────────
  const recordLike = useCallback(async (action: 'like' | 'pass' | 'view') => {
    if (!u.currentUser?.id) return;
    try {
      const opposite = action === 'like' ? 'pass' : action === 'pass' ? 'like' : null;
      if (opposite) {
        await supabase.from('likes').delete()
          .eq('from_user', u.currentUser.id).eq('to_user', u.id).eq('action', opposite);
      }
      await supabase.from('likes').upsert(
        { from_user: u.currentUser.id, to_user: u.id, action },
        { onConflict: 'from_user,to_user,action', ignoreDuplicates: true }
      );
    } catch (e) { console.error('[UserCard]', e); }
  }, [u]);

  // ── السوايب ───────────────────────────────────────────────
  const swipeTo = useCallback(async (dir: 1 | -1) => {
    if (busy) return;
    const action = dir === 1 ? 'like' : 'pass';

    // ① تحقق محلي فوري — بدون انتظار
    if (!canAfford(action)) {
      // رصيد غير كافٍ — أظهر Sonner وأعِد البطاقة
      const cost = action === 'like' ? 5 : 1;
      const bal  = 0; // canAfford يعرف الرصيد الحقيقي
      import('sonner').then(({ toast }) => {
        toast.error(action === 'like' ? 'نقاطك لا تكفي للإعجاب' : 'نقاطك لا تكفي للتخطي', {
          description: `تحتاج ${cost} نقاط`,
          action: { label: 'اكسب نقاط', onClick: () => { window.location.href = '/points'; } },
          duration: 4000,
        });
      });
      animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 });
      return;
    }

    setBusy(true);

    // ② تحريك البطاقة فوراً (optimistic)
    const exitAnim = animate(x, dir * 900, { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] });

    // ③ الخصم + تسجيل في الخلفية — بدون انتظار
    deduct({ action, target_id: u.id });
    recordLike(action);

    await exitAnim;
    x.set(0);
    setBusy(false);
    onNext();
  }, [busy, canAfford, deduct, recordLike, x, onNext, u.id]);

  const flash = (t: 'like' | 'pass') => {
    if (t === 'like') { setLikeFlash(true); setTimeout(() => setLikeFlash(false), 420); }
    else              { setPassFlash(true); setTimeout(() => setPassFlash(false), 420); }
  };

  const onDragStart = () => { isDragging.current = false; };
  const onDrag = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 8) isDragging.current = true;
  };
  const onDragEnd = (_: any, info: PanInfo) => {
    if      (info.offset.x >  110) { flash('like'); swipeTo(1);  }
    else if (info.offset.x < -110) { flash('pass'); swipeTo(-1); }
    else animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 });
  };

  const handleCardClick = () => {
    if (!isDragging.current) router.push(`/view?id=${u.id}`);
  };

  // تسجيل view بدون خصم عند ظهور البطاقة في الهوم
  if (!hasViewed.current && u.currentUser) {
    hasViewed.current = true;
    recordLike('view');
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', paddingBottom: 'var(--nav-h)' }}>

      {/* ══ البطاقة ══ */}
      <motion.div
        style={{ x, rotate, opacity: cardOp, position: 'absolute', inset: 0, cursor: 'grab' }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.38}
        dragMomentum={false}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onClick={handleCardClick}
        whileDrag={{ cursor: 'grabbing' }}
      >
        <img src={u.mainPhoto || '/default-avatar.png'} alt={u.name} draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            userSelect: 'none', pointerEvents: 'none',
            filter: u.prefersBlur ? 'blur(24px)' : 'none',
            transform: u.prefersBlur ? 'scale(1.08)' : 'none' }}
        />

        {/* تدرج أسفل */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, var(--bg-main) 0%, color-mix(in srgb, var(--bg-main) 55%, transparent) 32%, transparent 58%)' }} />

        {/* overlays السوايب */}
        <motion.div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to left, rgba(34,197,94,0.45) 0%, transparent 55%)', opacity: likeOp }} />
        <motion.div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to right, rgba(164,22,26,0.45) 0%, transparent 55%)', opacity: passOp }} />

        {/* مؤشر إعجاب */}
        <motion.div style={{ position: 'absolute', top: 'var(--sp-10)', right: 'var(--sp-5)',
          opacity: likeOp, pointerEvents: 'none',
          border: '2px solid #22c55e', borderRadius: 'var(--radius-md)',
          padding: '4px 14px', transform: 'rotate(-12deg)',
          display: 'flex', alignItems: 'center', gap: 6 }}>
          <ThumbsUp size={15} color="#22c55e" fill="#22c55e" />
          <span style={{ color: '#22c55e', fontWeight: 900, fontSize: 'var(--text-base)', letterSpacing: '0.06em' }}>إعجاب</span>
        </motion.div>

        {/* مؤشر تجاهل */}
        <motion.div style={{ position: 'absolute', top: 'var(--sp-10)', left: 'var(--sp-5)',
          opacity: passOp, pointerEvents: 'none',
          border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-md)',
          padding: '4px 14px', transform: 'rotate(12deg)',
          display: 'flex', alignItems: 'center', gap: 6 }}>
          <ThumbsDown size={15} color="var(--color-primary)" />
          <span style={{ color: 'var(--color-primary)', fontWeight: 900, fontSize: 'var(--text-base)', letterSpacing: '0.06em' }}>تجاهل</span>
        </motion.div>

        {/* الاسم + المعلومات */}
        <div style={{
          position: 'absolute', insetInlineStart: 0, insetInlineEnd: 0,
          // رُفع قليلاً ليترك مسافة للأزرار
          bottom: 'calc(var(--nav-h) + 7rem)',
          padding: '0 var(--sp-5)', direction: 'rtl', pointerEvents: 'none',
        }}>
          <h2 style={{ margin: '0 0 var(--sp-2)', color: 'var(--text-main)', fontWeight: 900,
            fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-tight)',
            textShadow: '0 1px 12px rgba(0,0,0,0.4)' }}>
            {u.name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            {!!u.age && (
              <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 'var(--text-md)',
                textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
                {u.age} سنة
              </span>
            )}
            {u.city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
                color: 'var(--text-secondary)', fontSize: 'var(--text-sm)',
                textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
                <MapPin size={12} style={{ flexShrink: 0 }} />{u.city}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══ الأزرار — توزيع متناسق ══ */}
      {/*
        المسافة بين الزرين: gap كبير يضمن تناسقاً
        لا قريبين من بعضهما ولا من الحواف
        الحجم أصغر من السابق: 56 للإعجاب، 48 للتجاهل
      */}
      <div style={{
        position: 'fixed',
        left: 0, right: 0,
        bottom: 'calc(var(--nav-h) + var(--sp-5))',
        zIndex: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(48px, 14vw, 80px)', // مسافة هندسية متكيفة مع عرض الشاشة
        paddingInline: 'clamp(40px, 12vw, 80px)',
      }}>

        {/* إعجاب — thumbs up */}
        <Btn3D
          variant="like"
          size={56}
          active={likeFlash}
          busy={busy}
          onClick={() => { flash('like'); swipeTo(1); }}
          icon={
            <ThumbsUp
              size={22}
              fill={likeFlash ? '#fff' : 'rgba(255,255,255,0.9)'}
              color="#fff"
              strokeWidth={1.4}
            />
          }
        />

        {/* تجاهل — thumbs down */}
        <Btn3D
          variant="pass"
          size={48}
          active={passFlash}
          busy={busy}
          onClick={() => { flash('pass'); swipeTo(-1); }}
          icon={
            <ThumbsDown
              size={19}
              color={passFlash ? '#fff' : 'rgba(200,200,210,0.85)'}
              strokeWidth={2.2}
            />
          }
        />
      </div>
    </div>
  );
}

// ── زر ثلاثي الأبعاد ──────────────────────────────────────────
function Btn3D({ variant, size, active, busy, onClick, icon }: {
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
        width: size, height: size,
        borderRadius: '50%',
        border: 'none', outline: 'none',
        cursor: busy ? 'not-allowed' : 'pointer',
        opacity: busy ? 0.4 : 1,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: faceColor,
        boxShadow,
        transition: 'box-shadow 0.18s, background 0.18s',
      }}
    >
      {/* بريق علوي */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(ellipse at 38% 22%, rgba(255,255,255,0.22) 0%, transparent 62%)',
        pointerEvents: 'none',
      }} />
      {icon}
    </motion.button>
  );
}
