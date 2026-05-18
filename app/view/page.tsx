'use client';
/**
 * 📁 app/view/page.tsx — ZAWAJ AI Premium
 */

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Heart, ShieldOff, MapPin, Briefcase,
  GraduationCap, BookOpen, Baby, Home, Users, Activity,
  Flame, Moon, Star, Globe, Smile, Ruler, HandHeart,
  ShieldCheck, Check, Share2, MoreVertical,
} from 'lucide-react';
import { supabase }     from '@/lib/supabase/client';
import { AutoBadge }    from '@/components/auto-badge';
import ReportSheet      from '@/components/security/ReportSheet';
import {
  COMMITTED_LEVELS, getNationality,
  getMaritalLabel, getEducationLabel,
  getReligiousLabel, getHousingLabel,
} from '@/constants/constants';
import { getSpecialtyLabel } from '@/constants/occupations';
import ChatWindow from '@/components/chat/ChatWindow';

// ══════════════════════════════════════════════════════════════
// 🔊 صوت من ملفات MP3
// ══════════════════════════════════════════════════════════════
function playSound(name: 'like' | 'unlike' | 'message' | 'share') {
  try {
    const audio = new Audio(`/sounds/${name}.mp3`);
    audio.volume = 0.55;
    audio.play().catch(() => {});
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════════
// 💫 جسيمات الإعجاب
// ══════════════════════════════════════════════════════════════
interface Particle { id: number; x: number; y: number; r: number; s: number }

function LikeParticles({ burst }: { burst: boolean }) {
  const [ps, setPs] = useState<Particle[]>([]);
  useEffect(() => {
    if (!burst) return;
    setPs(Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 90,
      y: -(Math.random() * 70 + 20),
      r: (Math.random() - 0.5) * 70,
      s: Math.random() * 0.55 + 0.25,
    })));
    const t = setTimeout(() => setPs([]), 900);
    return () => clearTimeout(t);
  }, [burst]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>
      <AnimatePresence>
        {ps.map(p => (
          <motion.div key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: p.s, rotate: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 0, rotate: p.r }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              marginLeft: -7, marginTop: -7,
              fontSize: 14, color: '#ef4444',
              pointerEvents: 'none', userSelect: 'none',
            }}>
            ♥
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// أيقونة إرسال رسالة — طائرة ورقية بزاوية صحيحة
// ══════════════════════════════════════════════════════════════
function SendIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// حالة التواجد
// ══════════════════════════════════════════════════════════════
function getOnlineStatus(lastActiveAt?: string) {
  if (!lastActiveAt) return false;
  return Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 60000) < 5;
}

// ══════════════════════════════════════════════════════════════
// صف معلومة
// ══════════════════════════════════════════════════════════════
function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center gap-3 py-[10px] border-b last:border-0" dir="rtl"
      style={{ borderColor: 'var(--glass-border)' }}>
      <span style={{ color: 'var(--color-accent)', opacity: 0.7, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, minWidth: 96, fontSize: 'calc(var(--base-font-size) * 0.69)' }}>{label}</span>
      <span style={{ color: 'var(--text-main)', fontWeight: 700, flex: 1, textAlign: 'right', fontSize: 'calc(var(--base-font-size) * 0.8)', lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function Block({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const kids = Array.isArray(children) ? (children as any[]).flat().filter(Boolean) : [children].filter(Boolean);
  if (!kids.length) return null;
  return (
    <div className="mb-3 rounded-[20px] overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <span style={{ color: 'var(--color-accent)', opacity: 0.65, display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 'calc(var(--base-font-size) * 0.58)', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{title}</span>
      </div>
      <div className="px-4 pb-1">{kids}</div>
    </div>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const col = pct >= 80 ? '#22c55e' : pct >= 50 ? 'var(--color-gold)' : 'var(--color-accent)';
  return (
    <div className="mb-3 rounded-[20px] px-4 py-3" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
      <div className="flex justify-between items-center mb-2" dir="rtl">
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.66)' }}>اكتمال الملف</span>
        <span style={{ color: col, fontWeight: 900, fontSize: 'calc(var(--base-font-size) * 0.75)' }}>{pct}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'var(--glass-border)', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
          style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${col}80,${col})` }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// زر دائري موحّد — 54px ثابت
// ══════════════════════════════════════════════════════════════
const BTN = 54;

function Btn({ onClick, children, glow, lit, disabled }: {
  onClick: () => void;
  children: React.ReactNode;
  glow?: string;
  lit?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.78 }}
      whileHover={{ scale: disabled ? 1 : 1.07 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: BTN, height: BTN, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative',
        background: lit && glow
          ? `radial-gradient(circle at center, ${glow}22 0%, transparent 70%), var(--glass-bg)`
          : 'var(--glass-bg)',
        border: `1.5px solid ${lit && glow ? glow + '55' : 'var(--glass-border)'}`,
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: lit && glow
          ? `0 0 18px ${glow}44, 0 2px 12px rgba(0,0,0,0.3)`
          : '0 2px 8px rgba(0,0,0,0.18)',
        transition: 'all 0.22s ease',
      }}
    >
      {children}
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
function ViewContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const userId       = searchParams.get('id') ?? '';

  const [profile,    setProfile]    = useState<any>(null);
  const [me,         setMe]         = useState<any>(null);
  const [myProfile,  setMyProfile]  = useState<any>(null);
  const [badge,      setBadge]      = useState('');
  const [liked,      setLiked]      = useState(false);
  const [liking,     setLiking]     = useState(false);
  const [burst,      setBurst]      = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [menu,       setMenu]       = useState(false);
  const [chatOpen,   setChatOpen]   = useState(false);
  const [convId,     setConvId]     = useState<string | null>(null);
  const [shared,     setShared]     = useState(false);
  const [blocked,    setBlocked]    = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [lightbox,   setLightbox]   = useState(false);
  const [msgFlash,   setMsgFlash]   = useState(false);

  const heartCtrl = useAnimation();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setMe(data.user);
      const { data: mp } = await supabase
        .from('profiles').select('show_photos').eq('id', data.user.id).single();
      setMyProfile(mp);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const [pR, wR] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('wallets').select('badge_type,badge_expires_at').eq('id', userId).maybeSingle(),
      ]);
      if (pR.data) setProfile(pR.data);
      if (wR.data?.badge_type && wR.data.badge_type !== 'none') {
        const exp = wR.data.badge_expires_at;
        if (!exp || new Date(exp) > new Date()) setBadge(wR.data.badge_type);
      }
      setLoading(false);
    })();
  }, [userId]);

  useEffect(() => {
    if (!me || !userId) return;
    supabase.from('likes').select('id')
      .eq('from_user', me.id).eq('to_user', userId).eq('action', 'like').maybeSingle()
      .then(({ data }) => { if (data) setLiked(true); });
    if (me.id !== userId) {
      supabase.from('likes').upsert(
        { from_user: me.id, to_user: userId, action: 'view' },
        { onConflict: 'from_user,to_user,action', ignoreDuplicates: true }
      );
    }
  }, [me, userId]);

  // ── إعجاب مع مؤثرات ─────────────────────────────────────────
  const handleLike = async () => {
    if (!me || liking) return;
    setLiking(true);
    if (liked) {
      playSound('unlike');
      setLiked(false);
      await heartCtrl.start({ scale: [1, 0.65, 1], transition: { duration: 0.22 } });
      await supabase.from('likes').delete()
        .eq('from_user', me.id).eq('to_user', userId).eq('action', 'like');
    } else {
      playSound('like');
      setLiked(true);
      setBurst(true);
      await heartCtrl.start({
        scale:    [1, 1.55, 0.8, 1.25, 0.95, 1],
        rotate:   [0, -8, 8, -4, 4, 0],
        transition: { duration: 0.55, times: [0, 0.18, 0.35, 0.55, 0.75, 1] },
      });
      setTimeout(() => setBurst(false), 900);
      await supabase.from('likes').upsert(
        { from_user: me.id, to_user: userId, action: 'like' },
        { onConflict: 'from_user,to_user,action', ignoreDuplicates: true }
      );
    }
    setLiking(false);
  };

  // ── رسالة ───────────────────────────────────────────────────
  const handleMessage = async () => {
    if (!me) return;
    playSound('message');
    setMsgFlash(true);
    setTimeout(() => setMsgFlash(false), 500);
    const { data: ex } = await supabase.from('conversations').select('id')
      .or(`and(user_1.eq.${me.id},user_2.eq.${userId}),and(user_1.eq.${userId},user_2.eq.${me.id})`)
      .maybeSingle();
    if (ex) { setConvId(ex.id); }
    else {
      const { data: nc } = await supabase.from('conversations')
        .insert({ user_1: me.id, user_2: userId }).select('id').single();
      setConvId(nc?.id ?? null);
    }
    setChatOpen(true);
  };

  // ── مشاركة ──────────────────────────────────────────────────
  const handleShare = async () => {
    playSound('share');
    const url = `${window.location.origin}/view?id=${userId}`;
    if (navigator.share) {
      try { await navigator.share({ title: profile?.full_name ?? 'ZAWAJ AI', text: 'شاهد هذا الملف على ZAWAJ AI', url }); }
      catch (_) { await navigator.clipboard.writeText(url); }
    } else {
      await navigator.clipboard.writeText(url);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  // ── حظر ─────────────────────────────────────────────────────
  const handleBlock = async () => {
    if (!me) return;
    setMenu(false);
    await supabase.from('blocks').upsert(
      { blocker_id: me.id, blocked_id: userId },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
    );
    setBlocked(true);
    setTimeout(() => router.back(), 1200);
  };

  // ── Loading ──────────────────────────────────────────────────
  if (!userId || loading || !profile) return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
        style={{ width: 30, height: 30, borderRadius: '50%', border: '2.5px solid var(--color-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  // ── بيانات مشتقة ─────────────────────────────────────────────
  const isMale      = profile.gender === 'male';
  const gender      = isMale ? 'male' : 'female';
  const committed   = COMMITTED_LEVELS.includes(profile.religious_commitment ?? -1);
  const pct         = profile.profile_completion_percent ?? 0;
  const name        = profile.full_name ?? '—';
  const isOnline    = getOnlineStatus(profile.last_active_at);
  const loc         = [profile.country, profile.city].filter(Boolean).join(' — ');
  const hw          = [profile.height ? `${profile.height} سم` : null, profile.weight ? `${profile.weight} كغ` : null].filter(Boolean).join(' · ') || null;
  const maritalLabel  = profile.marital_status       ? getMaritalLabel(profile.marital_status, gender) : null;
  const eduLabel      = profile.education_level      ? getEducationLabel(profile.education_level) : null;
  const religionLabel = profile.religious_commitment ? getReligiousLabel(profile.religious_commitment, gender) : null;
  const housingLabel  = profile.housing_type         ? getHousingLabel(profile.housing_type) : null;
  const jobLabel      = profile.occupation_id        ? getSpecialtyLabel(profile.occupation_id, gender) : null;
  const nat           = profile.country ? getNationality(profile.country, gender) : (profile.nationality ?? null);
  const isOwn         = me?.id === userId;

  // ── منطق الضبابية ────────────────────────────────────────────
  // صاحب الحساب اختار إخفاء صوره → نعرضها ضبابية
  // المستخدم الحالي اختار عدم رؤية الصور → كل الصور ضبابية
  const photoBlurred = profile.is_photos_blurred || (myProfile?.show_photos === false);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26 }}
        style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingBottom: isOwn ? 24 : 110 }}>

        {/* ── Hero ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px 20px', gap: 10 }} dir="rtl">

          {/* الصورة مع نقطة الاتصال */}
          <motion.div whileTap={{ scale: 0.94 }}
            onClick={() => !photoBlurred && setLightbox(true)}
            style={{ position: 'relative', cursor: photoBlurred ? 'default' : 'pointer' }}>

            {/* حلقة نابضة عند الاتصال */}
            {isOnline && (
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.15, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: '2px solid var(--color-primary)', pointerEvents: 'none' }}
              />
            )}

            <img src={profile.avatar_url || '/default-avatar.png'} alt={name}
              style={{
                width: 108, height: 108, borderRadius: '50%', objectFit: 'cover',
                border: '2.5px solid var(--glass-border)',
                filter: photoBlurred ? 'blur(14px)' : 'none',
                display: 'block',
              }} />

            {/* نقطة الاتصال — تقع على حافة الصورة */}
            <div style={{
              position: 'absolute',
              // تقع على الحافة: bottom = radius - dot_radius = 54 - 8 = 46 → لكن CSS: bottom يحسب من bottom border
              // نريد مركز النقطة على محيط الدائرة: الصورة 108px → radius=54
              // زاوية 45° bottom-right: x = 54 + 54*cos(45°) - 8 = 54 + 38.2 - 8 = 84.2 → right = 108 - 84.2 - 8 = 15.8
              bottom: 7, right: 7,
              width: 16, height: 16, borderRadius: '50%',
              background: isOnline ? 'var(--color-primary)' : 'rgba(150,150,170,0.5)',
              border: '2.5px solid var(--bg-main)',
              boxShadow: isOnline ? '0 0 10px var(--color-primary), 0 0 4px var(--color-primary)' : 'none',
              transition: 'all 0.35s ease',
              zIndex: 2,
            }} />
          </motion.div>

          {/* الاسم + البادج */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'calc(var(--base-font-size) * 1.3)', textAlign: 'center', letterSpacing: '-0.01em' }}>{name}</span>
            {badge && <AutoBadge value={badge as any} isBroker={false} size="text-[10px]" />}
          </div>

          {/* العمر + المدينة */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {profile.age && <span style={{ color: 'var(--text-secondary)', fontSize: 'calc(var(--base-font-size) * 0.84)', fontWeight: 600 }}>{profile.age} سنة</span>}
            {profile.city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.8)' }}>
                <MapPin size={11} /> {profile.city}
              </span>
            )}
          </div>

          {/* ── 4 أزرار دائرية متساوية ── */}
          {!isOwn && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, type: 'spring', stiffness: 280, damping: 22 }}
              style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'center' }}>

              {/* ❤️ إعجاب */}
              <div style={{ position: 'relative' }}>
                <LikeParticles burst={burst} />
                <motion.button
                  animate={heartCtrl}
                  whileTap={{ scale: liking ? 1 : 0.78 }}
                  onClick={handleLike}
                  disabled={liking}
                  style={{
                    width: BTN, height: BTN, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, position: 'relative',
                    background: liked
                      ? 'radial-gradient(circle at center, rgba(239,68,68,0.22) 0%, transparent 70%), var(--glass-bg)'
                      : 'var(--glass-bg)',
                    border: `1.5px solid ${liked ? 'rgba(239,68,68,0.55)' : 'var(--glass-border)'}`,
                    cursor: liking ? 'default' : 'pointer',
                    boxShadow: liked
                      ? '0 0 20px rgba(239,68,68,0.45), 0 2px 12px rgba(0,0,0,0.25)'
                      : '0 2px 8px rgba(0,0,0,0.18)',
                    transition: 'all 0.24s ease',
                  }}>
                  <Heart size={21}
                    fill={liked ? '#ef4444' : 'none'}
                    strokeWidth={liked ? 0 : 1.6}
                    color={liked ? '#ef4444' : 'rgba(255,255,255,0.55)'}
                  />
                </motion.button>
              </div>

              {/* ✈️ رسالة */}
              <motion.button
                whileTap={{ scale: 0.78 }}
                whileHover={{ scale: 1.07 }}
                onClick={handleMessage}
                style={{
                  width: BTN, height: BTN, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  background: msgFlash
                    ? 'radial-gradient(circle at center, rgba(56,189,248,0.22) 0%, transparent 70%), var(--glass-bg)'
                    : 'var(--glass-bg)',
                  border: `1.5px solid ${msgFlash ? 'rgba(56,189,248,0.55)' : 'var(--glass-border)'}`,
                  cursor: 'pointer',
                  boxShadow: msgFlash
                    ? '0 0 20px rgba(56,189,248,0.45), 0 2px 12px rgba(0,0,0,0.25)'
                    : '0 2px 8px rgba(0,0,0,0.18)',
                  transition: 'all 0.22s ease',
                }}>
                {/* أيقونة إرسال محاذاة ومتوازنة بصرياً */}
                <SendIcon size={20} color={msgFlash ? '#38bdf8' : 'rgba(255,255,255,0.55)'} />
              </motion.button>

              {/* 🔗 مشاركة */}
              <motion.button
                whileTap={{ scale: 0.78 }}
                whileHover={{ scale: 1.07 }}
                onClick={handleShare}
                style={{
                  width: BTN, height: BTN, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  background: shared
                    ? 'radial-gradient(circle at center, rgba(34,197,94,0.22) 0%, transparent 70%), var(--glass-bg)'
                    : 'var(--glass-bg)',
                  border: `1.5px solid ${shared ? 'rgba(34,197,94,0.55)' : 'var(--glass-border)'}`,
                  cursor: 'pointer',
                  boxShadow: shared
                    ? '0 0 20px rgba(34,197,94,0.45), 0 2px 12px rgba(0,0,0,0.25)'
                    : '0 2px 8px rgba(0,0,0,0.18)',
                  transition: 'all 0.22s ease',
                }}>
                {shared
                  ? <Check size={20} color="#22c55e" strokeWidth={2.2} />
                  : <Share2 size={19} color="rgba(255,255,255,0.55)" strokeWidth={1.6} />}
              </motion.button>

              {/* ⋮ ثلاث نقاط — حظر + بلاغ */}
              <div style={{ position: 'relative' }}>
                <motion.button
                  whileTap={{ scale: 0.78 }}
                  whileHover={{ scale: 1.07 }}
                  onClick={() => setMenu(v => !v)}
                  style={{
                    width: BTN, height: BTN, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    background: menu ? 'rgba(255,255,255,0.07)' : 'var(--glass-bg)',
                    border: '1.5px solid var(--glass-border)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    transition: 'all 0.2s ease',
                  }}>
                  <MoreVertical size={19} color="rgba(255,255,255,0.5)" strokeWidth={1.6} />
                </motion.button>

                <AnimatePresence>
                  {menu && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 8 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        style={{
                          position: 'absolute', bottom: BTN + 12, left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 101,
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 18, overflow: 'hidden', width: 160,
                          boxShadow: '0 16px 50px rgba(0,0,0,0.7)',
                        }}>
                        <button onClick={() => { setMenu(false); setReportOpen(true); }}
                          style={{ width: '100%', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl', background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', color: '#f87171', fontFamily: 'inherit', fontSize: 'calc(var(--base-font-size) * 0.82)', fontWeight: 600 }}>
                          <span style={{ fontSize: 13 }}>🚩</span> إبلاغ
                        </button>
                        <button onClick={handleBlock}
                          style={{ width: '100%', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl', background: 'transparent', border: 'none', cursor: 'pointer', color: blocked ? '#4ade80' : '#fb923c', fontFamily: 'inherit', fontSize: 'calc(var(--base-font-size) * 0.82)', fontWeight: 600 }}>
                          <ShieldOff size={13} /> {blocked ? 'تم الحظر ✓' : 'حظر'}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>

        {/* فاصل */}
        <div style={{ height: 1, background: 'var(--glass-border)', margin: '0 16px 16px' }} />

        {/* المحتوى */}
        <div style={{ padding: '0 16px' }}>
          <Block title="البيانات الأساسية" icon={<Users size={13}/>}>
            <Row icon={<Users size={13}/>}    label="الحالة المدنية"  value={maritalLabel} />
            <Row icon={<Globe size={13}/>}     label="الجنسية"         value={nat} />
            <Row icon={<MapPin size={13}/>}    label="الإقامة"         value={loc} />
            <Row icon={<Ruler size={13}/>}     label="الطول / الوزن"   value={hw} />
            <Row icon={<Smile size={13}/>}     label="لون البشرة"      value={profile.skin_color} />
            <Row icon={<Globe size={13}/>}     label="الانتقال"        value={profile.travel_willingness} />
            <Row icon={<HandHeart size={13}/>} label="نوع الزواج"      value={profile.marriage_type} />
          </Block>
          <Block title="المهنة والتعليم" icon={<Briefcase size={13}/>}>
            <Row icon={<Briefcase size={13}/>}     label="المهنة"          value={jobLabel} />
            <Row icon={<GraduationCap size={13}/>} label="المستوى الدراسي" value={eduLabel} />
            <Row icon={<Flame size={13}/>}          label="الوضع المادي"    value={profile.financial_status} />
          </Block>
          <Block title="الأطفال" icon={<Baby size={13}/>}>
            <Row icon={<Baby size={13}/>} label="لديه أطفال"
              value={profile.has_children !== undefined ? (profile.has_children ? `نعم (${profile.children_count ?? 0})` : 'لا') : null} />
            {profile.has_children && <Row icon={<Users size={13}/>} label="الحضانة" value={profile.children_custody} />}
            <Row icon={<Baby size={13}/>} label="رغبة بالإنجاب" value={profile.desire_for_children} />
          </Block>
          <Block title="السكن" icon={<Home size={13}/>}>
            <Row icon={<Home size={13}/>} label="السكن الحالي" value={housingLabel} />
            <Row icon={<Home size={13}/>} label="بعد الزواج"   value={profile.preferred_housing} />
          </Block>
          <Block title="الدين والالتزام" icon={<Moon size={13}/>}>
            <Row icon={<Moon size={13}/>}     label="الالتزام"     value={religionLabel} />
            <Row icon={<BookOpen size={13}/>} label="حفظ القرآن"   value={profile.quran_memorization} />
            {isMale && committed && <>
              <Row icon={<Star size={13}/>}     label="اللحية"       value={profile.beard_style} />
              <Row icon={<Activity size={13}/>} label="صلاة الجماعة" value={profile.prayer_commitment} />
            </>}
            {!isMale && committed && <Row icon={<ShieldCheck size={13}/>} label="اللباس" value={profile.hijab_style} />}
          </Block>
          <Block title="الصحة والعادات" icon={<Activity size={13}/>}>
            <Row icon={<Activity size={13}/>} label="الحالة الصحية" value={profile.health_status} />
            {isMale && <Row icon={<Flame size={13}/>} label="التدخين" value={profile.smoking} />}
          </Block>
          <Block title="الطبع والشخصية" icon={<Smile size={13}/>}>
            <Row icon={<Smile size={13}/>}    label="الشخصية"         value={profile.social_type} />
            <Row icon={<Star size={13}/>}      label="صباحي / مسائي"   value={profile.morning_evening} />
            <Row icon={<Home size={13}/>}      label="وقت المنزل"      value={profile.home_time} />
            <Row icon={<Users size={13}/>}     label="أسلوب الحوار"    value={profile.conflict_style} />
            <Row icon={<HandHeart size={13}/>} label="التعبير العاطفي" value={profile.affection_style} />
            <Row icon={<Users size={13}/>}     label="العلاقة بالأسرة" value={profile.relationship_with_family} />
            <Row icon={<Star size={13}/>}      label="أولويات الحياة"  value={profile.life_priority} />
            <Row icon={<Baby size={13}/>}      label="أسلوب التربية"   value={profile.parenting_style} />
          </Block>
          {!isMale && (
            <Block title="الزواج" icon={<HandHeart size={13}/>}>
              <Row icon={<Users size={13}/>}     label="قبول التعدد"      value={profile.polygamy_acceptance} />
              <Row icon={<Briefcase size={13}/>} label="العمل بعد الزواج" value={profile.work_after_marriage} />
            </Block>
          )}
          {profile.bio && (
            <div className="mb-3 rounded-[20px] overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.58)', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' }}>نبذة شخصية</span>
              </div>
              <p className="px-4 py-3 leading-relaxed" dir="rtl" style={{ color: 'var(--text-secondary)', fontSize: 'calc(var(--base-font-size) * 0.81)', margin: 0 }}>"{profile.bio}"</p>
            </div>
          )}
          {profile.partner_requirements && (
            <div className="mb-3 rounded-[20px] overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.58)', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' }}>يبحث عن</span>
              </div>
              <p className="px-4 py-3 leading-relaxed" dir="rtl" style={{ color: 'var(--text-secondary)', fontSize: 'calc(var(--base-font-size) * 0.81)', margin: 0 }}>{profile.partner_requirements}</p>
            </div>
          )}
          {pct > 0 && <CompletionBar pct={pct} />}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
            <motion.img initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              src={profile.avatar_url || '/default-avatar.png'} alt={name}
              style={{ maxWidth: '90vw', maxHeight: '86vh', borderRadius: 22, objectFit: 'contain', boxShadow: '0 40px 100px rgba(0,0,0,0.9)' }}
              onClick={e => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ReportSheet */}
      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUserId={userId}
        targetType="profile"
        targetId={userId}
      />

      {/* ChatWindow */}
      <AnimatePresence>
        {chatOpen && convId && profile && (
          <ChatWindow conversationId={convId} currentUserId={me!.id}
            recipient={{ id: profile.id, name: profile.full_name ?? '—', avatar: profile.avatar_url || '/default-avatar.png', role: profile.role ?? 'user', last_seen: profile.last_active_at }}
            onBack={() => setChatOpen(false)} onOpenProfile={() => {}} />
        )}
      </AnimatePresence>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
export default function ViewPage() {
  return (
    <Suspense fallback={
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
          style={{ width: 30, height: 30, borderRadius: '50%', border: '2.5px solid var(--color-accent)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <ViewContent />
    </Suspense>
  );
}