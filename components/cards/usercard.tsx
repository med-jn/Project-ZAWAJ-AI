'use client';
/**
 * 📁 components/cards/usercard.tsx — ZAWAJ AI v2
 * ✅ سوايب يمين = إعجاب | سوايب يسار = تجاهل
 * ✅ ضغط قصير على الصورة = فتح /view?id=...
 * ✅ زرّان فقط بلا نصوص — تصميم 3D فاخر
 * ✅ تدرج var(--bg-main) للايت/دارك
 */

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  motion, useMotionValue, useTransform,
  animate, PanInfo,
} from 'framer-motion';
import { Heart, X, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// ── Props ──────────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════
export default function UserCard({ userData: u, onNext }: UserCardProps) {
  const router = useRouter();

  const [likeFlash, setLikeFlash] = useState(false);
  const [passFlash, setPassFlash] = useState(false);
  const [busy,      setBusy]      = useState(false);
  const hasViewed  = useRef(false);
  const dragDist   = useRef(0);   // تتبع مسافة السحب للتفريق مع الضغط

  const x       = useMotionValue(0);
  const rotate  = useTransform(x, [-260, 260], [16, -16]);
  const cardOp  = useTransform(x, [-320, -110, 0, 110, 320], [0, 1, 1, 1, 0]);
  const likeOp  = useTransform(x, [20, 140], [0, 1]);
  const passOp  = useTransform(x, [-140, -20], [1, 0]);

  // ── تسجيل الفعل ────────────────────────────────────────────
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
    finally { if (action !== 'view') setBusy(false); }
  }, [u]);

  // ── انزلاق كامل حتى الاختفاء ────────────────────────────────
  const swipeTo = useCallback(async (dir: 1 | -1) => {
    if (busy) return;
    const action = dir === 1 ? 'like' : 'pass';
    act(action);
    await animate(x, dir * 900, {
      duration: 0.38,
      ease: [0.25, 0.46, 0.45, 0.94],
    });
    x.set(0);
    onNext();
  }, [act, x, onNext, busy]);

  // ── نهاية السحب ─────────────────────────────────────────────
  const onDragEnd = useCallback((_: any, info: PanInfo) => {
    const dist = info.offset.x;
    dragDist.current = Math.abs(dist);

    if (dist > 110) {
      flash('like');
      swipeTo(1);
    } else if (dist < -110) {
      flash('pass');
      swipeTo(-1);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 });
    }
  }, [swipeTo, x]);

  // ── ضغط على الصورة → فتح الملف الكامل ──────────────────────
  // نتحقق أن المسافة صغيرة (tap وليس drag)
  const handlePointerDown = () => { dragDist.current = 0; };
  const handlePointerUp   = () => {
    if (dragDist.current < 8) {
      router.push(`/view?id=${u.id}`);
    }
  };

  const flash = (t: 'like' | 'pass') => {
    if (t === 'like') { setLikeFlash(true); setTimeout(() => setLikeFlash(false), 420); }
    else              { setPassFlash(true); setTimeout(() => setPassFlash(false), 420); }
  };

  // تسجيل الزيارة مرة واحدة
  if (!hasViewed.current && u.currentUser) {
    hasViewed.current = true;
    act('view');
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      overflow: 'hidden',
      paddingBottom: 'var(--nav-h)',
    }}>

      {/* ══ البطاقة ══════════════════════════════════════════ */}
      <motion.div
        style={{
          x, rotate, opacity: cardOp,
          position: 'absolute', inset: 0,
          cursor: 'grab',
          touchAction: 'none',
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.38}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {/* الصورة */}
        <img
          src={u.mainPhoto || '/default-avatar.png'}
          alt={u.name}
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            userSelect: 'none',
            pointerEvents: 'none',
            filter:    u.prefersBlur ? 'blur(24px)' : 'none',
            transform: u.prefersBlur ? 'scale(1.08)' : 'none',
          }}
        />

        {/* تدرج أسفل — يتكيف مع لايت/دارك */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: [
            'linear-gradient(to top,',
            '  var(--bg-main) 0%,',
            '  color-mix(in srgb, var(--bg-main) 60%, transparent) 30%,',
            '  transparent 58%',
            ')',
          ].join(' '),
        }} />

        {/* Overlay إعجاب — أخضر من اليمين */}
        <motion.div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to left, rgba(34,197,94,0.45) 0%, transparent 55%)',
          opacity: likeOp,
        }} />

        {/* Overlay تجاهل — أحمر من اليسار */}
        <motion.div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to right, rgba(164,22,26,0.45) 0%, transparent 55%)',
          opacity: passOp,
        }} />

        {/* مؤشر إعجاب */}
        <motion.div style={{
          position: 'absolute',
          top: 'var(--sp-10)',
          right: 'var(--sp-5)',
          opacity: likeOp,
          pointerEvents: 'none',
          border: '2px solid #22c55e',
          borderRadius: 'var(--radius-md)',
          padding: '4px 14px',
          transform: 'rotate(-12deg)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Heart size={16} color="#22c55e" fill="#22c55e" />
          <span style={{ color: '#22c55e', fontWeight: 900, fontSize: 'var(--text-base)', letterSpacing: '0.06em' }}>
            إعجاب
          </span>
        </motion.div>

        {/* مؤشر تجاهل */}
        <motion.div style={{
          position: 'absolute',
          top: 'var(--sp-10)',
          left: 'var(--sp-5)',
          opacity: passOp,
          pointerEvents: 'none',
          border: '2px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 14px',
          transform: 'rotate(12deg)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <X size={16} color="var(--color-primary)" strokeWidth={2.5} />
          <span style={{ color: 'var(--color-primary)', fontWeight: 900, fontSize: 'var(--text-base)', letterSpacing: '0.06em' }}>
            تجاهل
          </span>
        </motion.div>

        {/* ── معلومات المستخدم ────────────────────────────── */}
        <div style={{
          position: 'absolute',
          insetInlineStart: 0,
          insetInlineEnd: 0,
          bottom: 'calc(var(--nav-h) + 5.5rem)',
          padding: '0 var(--sp-5)',
          direction: 'rtl',
          pointerEvents: 'none',
        }}>
          <h2 style={{
            margin: '0 0 var(--sp-2)',
            color: 'var(--text-main)',
            fontWeight: 900,
            fontSize: 'var(--text-2xl)',
            lineHeight: 'var(--lh-tight)',
            // ظل نصي فقط في الوضع الداكن — في اللايت النص بلونه يكفي
            textShadow: '0 1px 12px rgba(0,0,0,0.5)',
          }}>
            {u.name}
          </h2>

          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 'var(--sp-3)', flexWrap: 'wrap',
          }}>
            {!!u.age && (
              <span style={{
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: 'var(--text-md)',
                textShadow: '0 1px 8px rgba(0,0,0,0.45)',
              }}>
                {u.age} سنة
              </span>
            )}
            {u.city && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                textShadow: '0 1px 8px rgba(0,0,0,0.45)',
              }}>
                <MapPin size={12} style={{ flexShrink: 0 }} />
                {u.city}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══ الأزرار — 3D فاخر، بلا نصوص ══════════════════════
          توزيع: يمين بعيد = إعجاب | يسار بعيد = تجاهل
          الفجوة بينهما واسعة عمداً
      ════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'fixed',
        left: 0, right: 0,
        bottom: 'calc(var(--nav-h) + var(--sp-6))',
        zIndex: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-12)',          // فجوة كبيرة بين الزرّين
        direction: 'rtl',
        paddingInline: 'var(--sp-6)',
      }}>

        {/* زر الإعجاب — أكبر، أحمر، يمين */}
        <Btn3D
          variant="like"
          size={74}
          active={likeFlash}
          busy={busy}
          onClick={() => { flash('like'); swipeTo(1); }}
          icon={<Heart size={28} fill={likeFlash ? '#fff' : 'rgba(255,255,255,0.9)'} color="#fff" strokeWidth={1.5} />}
        />

        {/* زر التجاهل — أصغر قليلاً، رمادي، يسار */}
        <Btn3D
          variant="pass"
          size={62}
          active={passFlash}
          busy={busy}
          onClick={() => { flash('pass'); swipeTo(-1); }}
          icon={<X size={22} color={passFlash ? '#fff' : 'rgba(200,200,210,0.85)'} strokeWidth={2.5} />}
        />

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  زر 3D — طبقات ظل حقيقية + highlight علوي
// ══════════════════════════════════════════════════════════════
function Btn3D({
  variant, size, active, busy, onClick, icon,
}: {
  variant: 'like' | 'pass';
  size:    number;
  active:  boolean;
  busy?:   boolean;
  onClick: () => void;
  icon:    React.ReactNode;
}) {
  const isLike = variant === 'like';

  // ── ألوان حسب الحالة ──────────────────────────────────────
  const faceColor = isLike
    ? active
      ? 'linear-gradient(145deg, #e8293f 0%, #a3001a 100%)'
      : 'linear-gradient(145deg, #c8002c 0%, #8a0018 100%)'
    : active
      ? 'linear-gradient(145deg, #555570 0%, #35354a 100%)'
      : 'linear-gradient(145deg, #3a3a52 0%, #22223a 100%)';

  // ظل العمق (الجانب السفلي) — يوهم بالارتفاع
  const depthColor = isLike ? '#5a000e' : '#0e0e1e';

  // توهج خارجي
  const glowColor = isLike
    ? active ? 'rgba(200,0,44,0.65)' : 'rgba(192,0,42,0.38)'
    : active ? 'rgba(80,80,120,0.5)' : 'rgba(30,30,60,0.35)';

  // تظليل علوي داخلي (highlight زجاجي)
  const highlight = 'radial-gradient(ellipse at 38% 22%, rgba(255,255,255,0.22) 0%, transparent 62%)';

  const boxShadow = [
    `0 6px 0 ${depthColor}`,               // عمق 3D
    `0 10px 28px ${glowColor}`,            // توهج خارجي
    'inset 0 1px 0 rgba(255,255,255,0.18)',// حافة علوية مضيئة
    'inset 0 -2px 0 rgba(0,0,0,0.22)',     // حافة سفلية مظلمة
  ].join(', ');

  const boxShadowActive = [
    `0 2px 0 ${depthColor}`,
    `0 4px 18px ${glowColor}`,
    'inset 0 2px 4px rgba(0,0,0,0.35)',
  ].join(', ');

  return (
    <motion.button
      onClick={onClick}
      disabled={busy}
      whileTap={{ scale: 0.84, y: 4 }}
      whileHover={{ scale: 1.06, y: -2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      style={{
        width:  size,
        height: size,
        borderRadius: '50%',
        border: 'none',
        outline: 'none',
        cursor: busy ? 'not-allowed' : 'pointer',
        opacity: busy ? 0.35 : 1,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        // الوجه الأمامي
        background: faceColor,
        boxShadow: active ? boxShadowActive : boxShadow,
        transition: 'box-shadow 0.18s ease, background 0.18s ease',
      }}
    >
      {/* Highlight زجاجي علوي */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: highlight,
        pointerEvents: 'none',
      }} />
      {icon}
    </motion.button>
  );
}