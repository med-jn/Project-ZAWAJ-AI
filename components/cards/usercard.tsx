'use client';
/**
 * 📁 components/cards/usercard.tsx — ZAWAJ AI
 * ✅ منطق الضبابية الصحيح:
 *    - is_photos_blurred = true  → صورة هذا الشخص مضببة عند الجميع
 *    - show_photos = false       → المستخدم الحالي يرى الجميع مضببين
 * ✅ أزرار التفاعل في مكون ActionButtons منفصل (بدون نصوص)
 * ✅ إصلاح المسافات: bottom يعتمد على --nav-h-safe لدعم كل الهواتف
 */

import { useRef, useState, useCallback } from 'react';
import { useRouter }    from 'next/navigation';
import {
  motion, useMotionValue, useTransform, animate, PanInfo,
} from 'framer-motion';
import { MapPin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase }       from '@/lib/supabase/client';
import { useGiftCoins }   from '@/hooks/useGiftCoins';
import ActionButtons      from './ActionButtons';

// ── حجم الأزرار — غيّره من مكان واحد ──
const BTN_SIZE = 62;

export interface UserCardData {
  id:            string;
  name:          string;
  age:           number;
  gender?:       'male' | 'female';
  city?:         string;
  mainPhoto:     string;
  /**
   * is_photos_blurred: خيار صاحب الصورة (يضبب صورته عند الجميع)
   * showPhotos:        خيار المشاهِد الحالي (false = يضبب كل الصور)
   */
  prefersBlur?:  boolean;  // ← is_photos_blurred لصاحب البطاقة
  showPhotos?:   boolean;  // ← show_photos للمستخدم الحالي
  currentUser?:  { id: string } | null;
  distanceKm?:   number | null;
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
  const hasViewed  = useRef(false);
  const isDragging = useRef(false);

  const x      = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [16, -16]);
  const cardOp = useTransform(x, [-320, -110, 0, 110, 320], [0, 1, 1, 1, 0]);
  const likeOp = useTransform(x, [20, 140], [0, 1]);
  const passOp = useTransform(x, [-140, -20], [1, 0]);

  /**
   * منطق التضبيب النهائي:
   * تُضبَّب الصورة إذا:
   * (أ) صاحبها فعّل is_photos_blurred
   * (ب) المشاهِد الحالي أوقف show_photos
   */
  const shouldBlur = (u.prefersBlur === true) || (u.showPhotos === false);

  // ── تسجيل الإجراء في Supabase ────────────────────────────
  const recordLike = useCallback(async (action: 'like' | 'pass' | 'view') => {
    if (!u.currentUser?.id) return;
    try {
      const opposite = action === 'like' ? 'pass' : action === 'pass' ? 'like' : null;
      if (opposite) {
        await supabase.from('likes').delete()
          .eq('from_user', u.currentUser.id)
          .eq('to_user',   u.id)
          .eq('action',    opposite);
      }
      await supabase.from('likes').upsert(
        { from_user: u.currentUser.id, to_user: u.id, action },
        { onConflict: 'from_user,to_user,action', ignoreDuplicates: true }
      );
    } catch (e) { console.error('[UserCard]', e); }
  }, [u]);

  // ── السحب والتنفيذ ───────────────────────────────────────
  const swipeTo = useCallback(async (dir: 1 | -1) => {
    if (busy) return;
    const action = dir === 1 ? 'like' : 'pass';

    if (!canAfford(action)) {
      const cost = action === 'like' ? 5 : 1;
      import('sonner').then(({ toast }) => {
        toast.error(action === 'like' ? 'نقاطك لا تكفي للإعجاب' : 'نقاطك لا تكفي للتخطي', {
          description: `تحتاج ${cost} نقاط`,
          action: {
            label:   'اكسب نقاط',
            onClick: () => { window.location.href = '/points'; },
          },
          duration: 4000,
        });
      });
      animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 });
      return;
    }

    setBusy(true);
    const exitAnim = animate(x, dir * 900, {
      duration: 0.35,
      ease:     [0.25, 0.46, 0.45, 0.94],
    });
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
  const onDrag      = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 8) isDragging.current = true;
  };
  const onDragEnd   = (_: any, info: PanInfo) => {
    if      (info.offset.x >  110) { flash('like'); swipeTo(1);  }
    else if (info.offset.x < -110) { flash('pass'); swipeTo(-1); }
    else animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 });
  };

  const handleCardClick = () => {
    if (!isDragging.current) router.push(`/view?id=${u.id}`);
  };

  // تسجيل المشاهدة مرة واحدة
  if (!hasViewed.current && u.currentUser) {
    hasViewed.current = true;
    recordLike('view');
  }

  // ارتفاع منطقة المعلومات = nav + زر + هواء × 2
  const INFO_BOTTOM = `calc(var(--nav-h-safe) + ${BTN_SIZE}px + var(--sp-4) + var(--sp-6))`;

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>

      {/* ══ البطاقة ══════════════════════════════════════════ */}
      <motion.div
        style={{
          x, rotate, opacity: cardOp,
          position: 'absolute', inset: 0,
          cursor: 'grab',
        }}
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
        {/* ── الصورة ── */}
        <img
          src={u.mainPhoto || '/default-avatar.png'}
          alt={u.name}
          draggable={false}
          style={{
            position:      'absolute',
            inset:          0,
            width:          '100%',
            height:         '100%',
            objectFit:      'cover',
            userSelect:     'none',
            pointerEvents:  'none',
            // ✅ التضبيب يجمع العمودين
            filter:         shouldBlur ? 'blur(24px)' : 'none',
            transform:      shouldBlur ? 'scale(1.08)' : 'none',
            transition:     'filter 0.3s ease, transform 0.3s ease',
          }}
        />

        {/* تدرج أسفل */}
        <div style={{
          position:      'absolute',
          inset:          0,
          pointerEvents: 'none',
          background:    'linear-gradient(to top, var(--bg-main) 0%, color-mix(in srgb, var(--bg-main) 55%, transparent) 32%, transparent 58%)',
        }} />

        {/* overlays السحب */}
        <motion.div style={{
          position:      'absolute', inset: 0, pointerEvents: 'none',
          background:    'linear-gradient(to left, rgba(34,197,94,0.45) 0%, transparent 55%)',
          opacity:        likeOp,
        }} />
        <motion.div style={{
          position:      'absolute', inset: 0, pointerEvents: 'none',
          background:    'linear-gradient(to right, rgba(164,22,26,0.45) 0%, transparent 55%)',
          opacity:        passOp,
        }} />

        {/* مؤشر إعجاب */}
        <motion.div style={{
          position:      'absolute',
          top:            'var(--sp-10)',
          right:          'var(--sp-5)',
          opacity:        likeOp,
          pointerEvents: 'none',
          border:         '2px solid #22c55e',
          borderRadius:   'var(--radius-md)',
          padding:        '4px 14px',
          transform:      'rotate(-12deg)',
          display:        'flex',
          alignItems:     'center',
          gap:             6,
        }}>
          <ThumbsUp size={15} color="#22c55e" fill="#22c55e" />
          <span style={{
            color:         '#22c55e',
            fontWeight:     900,
            fontSize:      'var(--text-base)',
            letterSpacing: '0.06em',
          }}>إعجاب</span>
        </motion.div>

        {/* مؤشر تجاهل */}
        <motion.div style={{
          position:      'absolute',
          top:            'var(--sp-10)',
          left:           'var(--sp-5)',
          opacity:        passOp,
          pointerEvents: 'none',
          border:         '2px solid var(--color-primary)',
          borderRadius:   'var(--radius-md)',
          padding:        '4px 14px',
          transform:      'rotate(12deg)',
          display:        'flex',
          alignItems:     'center',
          gap:             6,
        }}>
          <ThumbsDown size={15} color="var(--color-primary)" />
          <span style={{
            color:         'var(--color-primary)',
            fontWeight:     900,
            fontSize:      'var(--text-base)',
            letterSpacing: '0.06em',
          }}>تجاهل</span>
        </motion.div>

        {/* ── الاسم + العمر + المدينة ── */}
        <div style={{
          position:         'absolute',
          insetInlineStart:  0,
          insetInlineEnd:    0,
          bottom:            INFO_BOTTOM,
          padding:           '0 var(--sp-5)',
          direction:         'rtl',
          pointerEvents:     'none',
        }}>
          <h2 style={{
            margin:     '0 0 var(--sp-2)',
            color:      'var(--color-secondary)',
            fontWeight:  900,
            fontSize:   'var(--text-2xl)',
            lineHeight: 'var(--lh-tight)',
            textShadow: 'none',
          }}>
            {u.name}
          </h2>

          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        'var(--sp-3)',
            flexWrap:   'wrap',
          }}>
            {!!u.age && (
              <span style={{
                color:      'var(--color-secondary)',
                fontWeight:  700,
                fontSize:   'var(--text-md)',
                textShadow: 'none',
              }}>
                {u.age} سنة
              </span>
            )}
            {u.city && (
              <span style={{
                display:    'flex',
                alignItems: 'center',
                gap:        'var(--sp-1)',
                color:      'var(--color-secondary)',
                fontSize:   'var(--text-sm)',
                textShadow: 'none',
              }}>
                <MapPin size={12} style={{ flexShrink: 0 }} />{u.city}
              </span>
            )}
            {/* المسافة إن وُجدت */}
            {u.distanceKm != null && (
              <span style={{
                color:     'var(--color-secondary)',
                fontSize:  'var(--text-sm)',
                opacity:    0.75,
              }}>
                {u.distanceKm < 1
                  ? '< 1 كم'
                  : `${Math.round(u.distanceKm)} كم`
                }
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══ أزرار التفاعل ═══════════════════════════════════ */}
      <ActionButtons
        onLike={() => { flash('like'); swipeTo(1);  }}
        onPass={() => { flash('pass'); swipeTo(-1); }}
        likeFlash={likeFlash}
        passFlash={passFlash}
        busy={busy}
        size={BTN_SIZE}
      />
    </div>
  );
}