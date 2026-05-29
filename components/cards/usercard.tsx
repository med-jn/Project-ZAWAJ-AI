'use client';
/**
 * 📁 components/cards/usercard.tsx — ZAWAJ AI
 * ✅ سوايب يمين = إعجاب | سوايب يسار = تجاهل
 * ✅ الضغط على الصورة يفتح /view/[id]
 * ✅ زرّان فقط: إعجاب + تجاهل — ثلاثي الأبعاد عصري
 * ✅ تدرج أسفل من var(--bg-main)
 * ✅ بدون أي منطق نقاط/شراء
 */

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
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
  userData:      UserCardData;
  onNext:        () => void;
}

// ══════════════════════════════════════════════════════════════
export default function UserCard({ userData: u, onNext }: UserCardProps) {
  const router = useRouter();
  const [likeFlash, setLikeFlash] = useState(false);
  const [passFlash, setPassFlash] = useState(false);
  const [busy,      setBusy]      = useState(false);
  const hasViewed = useRef(false);
  const tapTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const x       = useMotionValue(0);
  const rotate  = useTransform(x, [-240, 240], [14, -14]);
  const cardOp  = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0]);
  const likeOp  = useTransform(x, [0, 130], [0, 1]);
  const passOp  = useTransform(x, [-130, 0], [1, 0]);

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

  // ── سوايب كامل حتى الاختفاء ─────────────────────────────────
  const swipeTo = useCallback(async (dir: 1 | -1) => {
    if (busy) return;
    const action = dir === 1 ? 'like' : 'pass';
    act(action);
    // انزلاق حتى خارج الشاشة
    await animate(x, dir * 800, { duration: 0.38, ease: [0.32, 0, 0.67, 0] });
    x.set(0);
    onNext();
  }, [act, x, onNext, busy]);

  const onDragEnd = (_: any, info: any) => {
    if      (info.offset.x >  110) { flash('like'); swipeTo(1);  }
    else if (info.offset.x < -110) { flash('pass'); swipeTo(-1); }
    else animate(x, 0, { type: 'spring', stiffness: 380, damping: 30 });
  };

  const flash = (t: 'like' | 'pass') => {
    if (t === 'like') { setLikeFlash(true); setTimeout(() => setLikeFlash(false), 450); }
    else              { setPassFlash(true); setTimeout(() => setPassFlash(false), 450); }
  };

  // تسجيل الزيارة مرة واحدة
  if (!hasViewed.current && u.currentUser) {
    hasViewed.current = true;
    act('view');
  }

  // ── الضغط على الصورة يفتح الملف الكامل ─────────────────────
  // نفرّق بين tap ودراغ باستخدام مؤقت + offset صغير
  const handleTap = () => {
    router.push(`/view/${u.id}`);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      paddingBottom: 'var(--nav-h)',
    }}>

      {/* ══ البطاقة ══ */}
      <motion.div
        style={{ x, rotate, opacity: cardOp }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.45}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        onTap={handleTap}
        className="absolute inset-0"
        style={{ x, rotate, opacity: cardOp, position: 'absolute', inset: 0 }}
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
            filter:    u.prefersBlur ? 'blur(24px)' : 'none',
            transform: u.prefersBlur ? 'scale(1.1)' : 'none',
          }}
        />

        {/* تدرج أسفل — يتكيف مع اللايت/دارك من var(--bg-main) */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, var(--bg-main) 0%, rgba(0,0,0,0) 55%)',
        }} />

        {/* overlay إعجاب */}
        <motion.div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to left, rgba(34,197,94,0.5), transparent 60%)',
          opacity: likeOp,
        }} />

        {/* overlay تجاهل */}
        <motion.div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to right, rgba(164,22,26,0.5), transparent 60%)',
          opacity: passOp,
        }} />

        {/* مؤشر إعجاب */}
        <motion.div style={{
          position: 'absolute', top: 'var(--sp-8)', right: 'var(--sp-6)',
          opacity: likeOp, pointerEvents: 'none',
          border: '2.5px solid #22c55e',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--sp-1) var(--sp-4)',
          transform: 'rotate(-10deg)',
        }}>
          <span style={{ color: '#22c55e', fontWeight: 900, fontSize: 'var(--text-lg)', letterSpacing: '0.08em' }}>
            إعجاب ❤️
          </span>
        </motion.div>

        {/* مؤشر تجاهل */}
        <motion.div style={{
          position: 'absolute', top: 'var(--sp-8)', left: 'var(--sp-6)',
          opacity: passOp, pointerEvents: 'none',
          border: '2.5px solid var(--color-accent)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--sp-1) var(--sp-4)',
          transform: 'rotate(10deg)',
        }}>
          <span style={{ color: 'var(--color-accent)', fontWeight: 900, fontSize: 'var(--text-lg)', letterSpacing: '0.08em' }}>
            تجاوز ✕
          </span>
        </motion.div>

        {/* الاسم + المعلومات */}
        <div style={{
          position: 'absolute',
          right: 'var(--sp-5)', left: 'var(--sp-5)',
          bottom: 'calc(var(--nav-h) + 5rem)',
          direction: 'rtl', pointerEvents: 'none',
        }}>
          <h2 style={{
            color: '#fff', fontWeight: 900, margin: '0 0 var(--sp-2)',
            fontSize: 'var(--text-2xl)',
            textShadow: '0 2px 20px rgba(0,0,0,0.95)',
            lineHeight: 'var(--lh-tight)',
          }}>
            {u.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
            {!!u.age && (
              <span style={{
                color: 'rgba(255,255,255,0.95)', fontWeight: 700,
                fontSize: 'var(--text-md)',
                textShadow: '0 1px 10px rgba(0,0,0,0.9)',
              }}>
                {u.age} سنة
              </span>
            )}
            {u.city && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
                color: 'rgba(255,255,255,0.85)', fontSize: 'var(--text-sm)',
                textShadow: '0 1px 10px rgba(0,0,0,0.9)',
              }}>
                <MapPin size={13} style={{ flexShrink: 0 }} />
                {u.city}
              </span>
            )}
          </div>

          {/* تلميح فتح الملف */}
          <p style={{
            color: 'rgba(255,255,255,0.35)', fontSize: 'var(--text-2xs)',
            margin: 'var(--sp-2) 0 0', fontWeight: 600,
          }}>
            اضغط على الصورة لعرض الملف الكامل
          </p>
        </div>
      </motion.div>

      {/* ══ الأزرار — ثلاثي الأبعاد عصري ══ */}
      <div style={{
        position: 'fixed', left: 0, right: 0, zIndex: 180,
        bottom: 'calc(var(--nav-h) + var(--sp-4))',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 'var(--sp-8)',
        direction: 'rtl',
      }}>

        {/* ── زر الإعجاب ── */}
        <ActionBtn
          label="إعجاب"
          icon={<Heart size={26} fill={likeFlash ? '#fff' : 'none'} color="#fff" strokeWidth={2} />}
          active={likeFlash}
          busy={busy}
          variant="like"
          onClick={() => { flash('like'); swipeTo(1); }}
        />

        {/* ── زر التجاهل ── */}
        <ActionBtn
          label="تجاهل"
          icon={<X size={22} color={passFlash ? '#fff' : 'rgba(200,200,200,0.8)'} strokeWidth={2.5} />}
          active={passFlash}
          busy={busy}
          variant="pass"
          onClick={() => { flash('pass'); swipeTo(-1); }}
        />

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  زر ثلاثي الأبعاد
// ══════════════════════════════════════════════════════════════
function ActionBtn({
  label, icon, active, busy, variant, onClick,
}: {
  label:   string;
  icon:    React.ReactNode;
  active:  boolean;
  busy?:   boolean;
  variant: 'like' | 'pass';
  onClick: () => void;
}) {
  const isLike = variant === 'like';

  // ألوان حسب النوع والحالة
  const bg      = isLike
    ? active ? '#c0002a' : 'rgba(192,0,42,0.18)'
    : active ? 'rgba(80,80,100,0.5)' : 'rgba(255,255,255,0.07)';

  const border  = isLike
    ? active ? 'rgba(255,80,100,0.8)' : 'rgba(192,0,42,0.45)'
    : active ? 'rgba(200,200,220,0.5)' : 'rgba(255,255,255,0.15)';

  // ظل ثلاثي الأبعاد: طبقتان — واحدة للعمق وواحدة للتوهج
  const shadow  = isLike
    ? active
      ? '0 2px 0 #7a0018, 0 4px 16px rgba(192,0,42,0.6), 0 0 0 3px rgba(192,0,42,0.2)'
      : '0 4px 0 rgba(100,0,15,0.6), 0 6px 24px rgba(192,0,42,0.3), inset 0 1px 0 rgba(255,120,140,0.15)'
    : active
      ? '0 2px 0 rgba(30,30,50,0.8), 0 4px 12px rgba(0,0,0,0.4)'
      : '0 4px 0 rgba(0,0,0,0.45), 0 6px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)';

  const size = isLike ? 72 : 58;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-2)' }}>
      <motion.button
        whileTap={{ scale: 0.82, y: 4 }}
        whileHover={{ scale: 1.07, y: -2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        onClick={onClick}
        disabled={busy}
        style={{
          width:  size, height: size,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background:  bg,
          border:      `1.5px solid ${border}`,
          boxShadow:   shadow,
          cursor:      busy ? 'not-allowed' : 'pointer',
          opacity:     busy ? 0.4 : 1,
          outline:     'none',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          transition:  'background 0.2s, box-shadow 0.2s, border-color 0.2s',
          flexShrink: 0,
          // خط داخلي يوهم بالعمق
          backgroundImage: isLike
            ? `radial-gradient(ellipse at 30% 25%, rgba(255,100,120,0.18) 0%, transparent 65%)`
            : `radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.06) 0%, transparent 65%)`,
        }}
      >
        {icon}
      </motion.button>

      <span style={{
        fontSize:      'var(--text-2xs)',
        fontWeight:    700,
        color:         isLike ? 'rgba(255,100,120,0.7)' : 'rgba(255,255,255,0.35)',
        letterSpacing: '0.06em',
        userSelect:    'none',
      }}>
        {label}
      </span>
    </div>
  );
}