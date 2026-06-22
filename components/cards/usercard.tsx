'use client';
/**
 * 📁 components/cards/usercard.tsx — ZAWAJ AI Premium v3
 *
 * ✨ الجديد:
 *  - لوحة المعلومات: زجاج ضبابي خفيف يطفو فوق الصورة
 *  - بطاقة خلفية خافتة تلمح للشخص القادم (scale صغير خلف البطاقة)
 *  - haptic عند السحب الناجح عبر Capacitor
 *  - parallax الصورة محسّن
 *  - overlays radial سينمائية
 *  - دخول سينمائي: scale+blur spring
 */

import { useRef, useState, useCallback } from 'react';
import { useRouter }   from 'next/navigation';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  animate,
  PanInfo,
} from 'framer-motion';
import { MapPin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase }     from '@/lib/supabase/client';
import { useGiftCoins } from '@/hooks/useGiftCoins';
import ActionButtons    from './ActionButtons';

const BTN_SIZE = 66;

async function haptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch {}
}

export interface UserCardData {
  id:           string;
  name:         string;
  age:          number;
  gender?:      'male' | 'female';
  city?:        string;
  mainPhoto:    string;
  prefersBlur?: boolean;
  showPhotos?:  boolean;
  currentUser?: { id: string } | null;
  distanceKm?:  number | null;
}

export interface UserCardProps {
  userData:    UserCardData;
  nextUserPhoto?: string | null;   // ← صورة البطاقة القادمة للخلفية
  onNext:      () => void;
}

export default function UserCard({ userData: u, nextUserPhoto, onNext }: UserCardProps) {
  const router = useRouter();
  const { deduct, canAfford } = useGiftCoins();

  const [likeFlash, setLikeFlash] = useState(false);
  const [passFlash, setPassFlash] = useState(false);
  const [busy,      setBusy]      = useState(false);
  const hasViewed  = useRef(false);
  const isDragging = useRef(false);

  // ── موشن ──────────────────────────────────────────────────
  const x      = useMotionValue(0);
  const rotate = useTransform(x, [-280, 280], [18, -18]);
  const cardOp = useTransform(x, [-340, -120, 0, 120, 340], [0, 1, 1, 1, 0]);
  const imgX   = useTransform(x, v => v * -0.10);

  const likeOp = useTransform(x, [15, 130], [0, 1]);
  const passOp = useTransform(x, [-130, -15], [1, 0]);
  const likeOpS = useSpring(likeOp, { stiffness: 160, damping: 20 });
  const passOpS = useSpring(passOp, { stiffness: 160, damping: 20 });

  // البطاقة الخلفية تكبر كلما سحبنا البطاقة الأمامية
  const absX       = useTransform(x, v => Math.abs(v));
  const backScale  = useTransform(absX, [0, 200], [0.90, 1.0]);
  const backOp     = useTransform(absX, [0, 60],  [0.55, 1.0]);

  const shouldBlur = (u.prefersBlur === true) || (u.showPhotos === false);

  // ── Supabase ───────────────────────────────────────────────
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
        { onConflict: 'from_user,to_user,action', ignoreDuplicates: true },
      );
    } catch (e) { console.error('[UserCard]', e); }
  }, [u]);

  // ── السحب ─────────────────────────────────────────────────
  const swipeTo = useCallback(async (dir: 1 | -1) => {
    if (busy) return;
    const action = dir === 1 ? 'like' : 'pass';

    if (!canAfford(action)) {
      const cost = action === 'like' ? 5 : 1;
      import('sonner').then(({ toast }) => {
        toast.error(
          action === 'like' ? 'نقاطك لا تكفي للإعجاب' : 'نقاطك لا تكفي للتخطي',
          {
            description: `تحتاج ${cost} نقاط`,
            action: {
              label:   'اكسب نقاط',
              onClick: () => { window.location.href = '/points'; },
            },
            duration: 4000,
          },
        );
      });
      animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 });
      return;
    }

    setBusy(true);
    haptic(action === 'like' ? 'medium' : 'light');
    const exitAnim = animate(x, dir * 980, {
      duration: 0.40,
      ease:     [0.22, 1, 0.36, 1],
    });
    deduct({ action, target_id: u.id });
    recordLike(action);
    await exitAnim;
    x.set(0);
    setBusy(false);
    onNext();
  }, [busy, canAfford, deduct, recordLike, x, onNext, u.id]);

  const flash = (t: 'like' | 'pass') => {
    if (t === 'like') { setLikeFlash(true); setTimeout(() => setLikeFlash(false), 440); }
    else              { setPassFlash(true); setTimeout(() => setPassFlash(false), 440); }
  };

  const onDragStart = () => { isDragging.current = false; };
  const onDrag      = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 8) isDragging.current = true;
  };
  const onDragEnd   = (_: any, info: PanInfo) => {
    const vel = info.velocity.x;
    if      (info.offset.x >  95 || (vel >  580 && info.offset.x > 35)) {
      flash('like'); swipeTo(1);
    } else if (info.offset.x < -95 || (vel < -580 && info.offset.x < -35)) {
      flash('pass'); swipeTo(-1);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  const handleCardClick = () => {
    if (!isDragging.current) router.push(`/view?id=${u.id}`);
  };

  if (!hasViewed.current && u.currentUser) {
    hasViewed.current = true;
    recordLike('view');
  }

  // ارتفاع اللوحة الزجاجية
  const GLASS_HEIGHT = `calc(var(--nav-h-safe) + ${BTN_SIZE}px + var(--sp-5) + var(--sp-10) + 72px)`;

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>

      {/* ══ البطاقة الخلفية (البطاقة القادمة) ══════════════ */}
      <motion.div
        style={{
          position:  'absolute',
          inset:      0,
          scale:      backScale,
          opacity:    backOp,
          zIndex:     0,
          borderRadius: 'var(--radius-xl)',
          overflow:  'hidden',
          pointerEvents: 'none',
        }}
      >
        <img
          src={nextUserPhoto || '/default-avatar.png'}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position:  'absolute',
            inset:      0,
            width:     '100%',
            height:    '100%',
            objectFit: 'cover',
            // ضبابية خفيفة للبطاقة الخلفية دائماً
            filter:    'blur(3px) brightness(0.7)',
          }}
        />
        {/* تعتيم فوقها */}
        <div style={{
          position:  'absolute',
          inset:      0,
          background:'rgba(0,0,0,0.28)',
        }} />
      </motion.div>

      {/* ══ البطاقة الأمامية ═════════════════════════════════ */}
      <motion.div
        key={u.id}
        initial={{ scale: 0.88, opacity: 0, filter: 'blur(10px)' }}
        animate={{
          scale: 1, opacity: 1, filter: 'blur(0px)',
          transition: {
            type:      'spring',
            stiffness:  210,
            damping:    26,
            mass:        1.0,
          },
        }}
        style={{
          x,
          rotate,
          opacity:    cardOp,
          position:  'absolute',
          inset:      0,
          cursor:    'grab',
          zIndex:     1,
          willChange:'transform',
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.30}
        dragMomentum={false}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onClick={handleCardClick}
        whileDrag={{ cursor: 'grabbing' }}
      >

        {/* ── الصورة مع Parallax ── */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <motion.img
            src={u.mainPhoto || '/default-avatar.png'}
            alt={u.name}
            draggable={false}
            style={{
              position:     'absolute',
              inset:        '-5%',
              width:        '110%',
              height:       '110%',
              objectFit:    'cover',
              userSelect:   'none',
              pointerEvents:'none',
              x:             imgX,
              filter:        shouldBlur ? 'blur(26px) saturate(0.5)' : 'none',
              willChange:   'transform',
            } as any}
          />
        </div>

        {/* ── طبقة تدرج علوي خفيف ── */}
        <div style={{
          position:      'absolute',
          top:            0, left: 0, right: 0,
          height:        '22%',
          pointerEvents: 'none',
          background:    'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 100%)',
        }} />

        {/* ── overlay إعجاب radial ── */}
        <motion.div style={{
          position:      'absolute', inset: 0, pointerEvents: 'none',
          background:    'radial-gradient(ellipse at 88% 50%, rgba(34,197,94,0.50) 0%, transparent 62%)',
          opacity:        likeOpS,
        }} />

        {/* ── overlay تجاهل radial ── */}
        <motion.div style={{
          position:      'absolute', inset: 0, pointerEvents: 'none',
          background:    'radial-gradient(ellipse at 12% 50%, rgba(220,38,38,0.48) 0%, transparent 62%)',
          opacity:        passOpS,
        }} />

        {/* ── Stamp إعجاب ── */}
        <motion.div style={{
          position:      'absolute',
          top:           'var(--sp-12)',
          right:         'var(--sp-5)',
          opacity:        likeOpS,
          pointerEvents: 'none',
          rotate:        -14,
        }}>
          <div style={{
            border:         '2.5px solid #22c55e',
            borderRadius:   'var(--radius-sm)',
            padding:        '5px 16px',
            display:        'flex',
            alignItems:     'center',
            gap:             6,
            backdropFilter: 'blur(6px)',
            background:     'rgba(34,197,94,0.10)',
            boxShadow:      '0 0 20px rgba(34,197,94,0.28)',
          }}>
            <ThumbsUp size={14} color="#22c55e" fill="#22c55e" />
            <span style={{
              color: '#22c55e', fontWeight: 900,
              fontSize: 'var(--text-sm)', letterSpacing: '0.10em',
            }}>إعجاب</span>
          </div>
        </motion.div>

        {/* ── Stamp تجاهل ── */}
        <motion.div style={{
          position:      'absolute',
          top:           'var(--sp-12)',
          left:          'var(--sp-5)',
          opacity:        passOpS,
          pointerEvents: 'none',
          rotate:         14,
        }}>
          <div style={{
            border:         '2.5px solid var(--color-primary)',
            borderRadius:   'var(--radius-sm)',
            padding:        '5px 16px',
            display:        'flex',
            alignItems:     'center',
            gap:             6,
            backdropFilter: 'blur(6px)',
            background:     'rgba(179,51,75,0.10)',
            boxShadow:      '0 0 20px rgba(179,51,75,0.28)',
          }}>
            <ThumbsDown size={14} color="var(--color-primary)" />
            <span style={{
              color: 'var(--color-primary)', fontWeight: 900,
              fontSize: 'var(--text-sm)', letterSpacing: '0.10em',
            }}>تجاهل</span>
          </div>
        </motion.div>

        {/* ══ اللوحة الزجاجية السفلية ═══════════════════════
            تحل محل التدرج الأسود — زجاج ضبابي خفيف يطفو
            فوق الصورة ويحتضن الاسم + الأزرار معاً          */}
        <div style={{
          position:       'absolute',
          bottom:          0,
          left:            0,
          right:           0,
          height:          GLASS_HEIGHT,
          pointerEvents:  'none',
          // ── الزجاج ──
          backdropFilter: 'blur(22px) saturate(140%)',
          WebkitBackdropFilter: 'blur(22px) saturate(140%)',
          background:     'rgba(10,0,10,0.38)',
          // حافة علوية شفافة تحاكي انكسار الضوء
          borderTop:      '1px solid rgba(255,255,255,0.10)',
          // تدرج خفيف من شفاف → زجاج لانتقال سلس
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%)',
          maskImage:       'linear-gradient(to bottom, transparent 0%, black 18%)',
        }} />

        {/* ══ معلومات الشخص (فوق اللوحة الزجاجية) ══════════ */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{
            y: 0, opacity: 1,
            transition: {
              type: 'spring', stiffness: 280, damping: 28, delay: 0.14,
            },
          }}
          style={{
            position:         'absolute',
            insetInlineStart:  0,
            insetInlineEnd:    0,
            // يجلس فوق الأزرار مباشرة داخل اللوحة الزجاجية
            bottom:           `calc(var(--nav-h-safe) + ${BTN_SIZE}px + var(--sp-5) + var(--sp-3))`,
            padding:          '0 var(--sp-5)',
            direction:        'rtl',
            pointerEvents:    'none',
            zIndex:            2,
          }}
        >
          <h2 style={{
            margin:        '0 0 var(--sp-2)',
            color:         '#ffffff',
            fontWeight:     900,
            fontSize:      'var(--text-2xl)',
            lineHeight:    'var(--lh-tight)',
            letterSpacing: '-0.01em',
            // ظل ناعم يقرأ على الزجاج
            textShadow:    '0 1px 8px rgba(0,0,0,0.45)',
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
                color:      'rgba(255,255,255,0.88)',
                fontWeight:  700,
                fontSize:   'var(--text-md)',
                textShadow: '0 1px 5px rgba(0,0,0,0.40)',
              }}>
                {u.age} سنة
              </span>
            )}
            {u.city && (
              <span style={{
                display:    'flex',
                alignItems: 'center',
                gap:        'var(--sp-1)',
                color:      'rgba(255,255,255,0.72)',
                fontSize:   'var(--text-sm)',
                textShadow: '0 1px 4px rgba(0,0,0,0.38)',
              }}>
                <MapPin size={11} style={{ flexShrink: 0, opacity: 0.80 }} />
                {u.city}
              </span>
            )}
            {u.distanceKm != null && (
              <span style={{
                color:     'rgba(255,255,255,0.50)',
                fontSize:  'var(--text-xs)',
                textShadow:'0 1px 3px rgba(0,0,0,0.35)',
              }}>
                {u.distanceKm < 1 ? '< 1 كم' : `${Math.round(u.distanceKm)} كم`}
              </span>
            )}
          </div>
        </motion.div>

      </motion.div>

      {/* ══ أزرار التفاعل (فوق كل شيء) ═════════════════════ */}
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