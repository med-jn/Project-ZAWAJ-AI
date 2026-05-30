'use client';
/**
 * 📁 app/view/page.tsx — ZAWAJ AI
 * يُستدعى عبر: /view?id=USER_ID
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter }    from 'next/navigation';
import { motion, AnimatePresence }       from 'framer-motion';
import {
  ArrowRight, Heart, MessageCircle,
  Share2, Flag, ShieldOff, Copy,
  MapPin, Briefcase, GraduationCap,
  BookOpen, Baby, Home, Users, Activity,
  Flame, Moon, Star, Globe, Smile,
  Ruler, HandHeart, ShieldCheck,
} from 'lucide-react';
import { supabase }  from '@/lib/supabase/client';
import OnlineDot     from '@/components/profile/OnlineDot';
import {
  COMMITTED_LEVELS, getNationality,
  getMaritalLabel, getEducationLabel,
  getReligiousLabel, getHousingLabel,
} from '@/constants/constants';
import { getSpecialtyLabel } from '@/constants/occupations';
import ChatWindow from '@/components/chat/ChatWindow';

// ── مكوّنات مشتركة ────────────────────────────────────────────
function Row({ icon, label, value }: {
  icon: React.ReactNode; label: string; value?: string | number | null;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div dir="rtl" style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
      padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--glass-border)',
    }}>
      <span style={{ color: 'var(--color-primary)', opacity: 0.65, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, minWidth: 96, fontSize: 'var(--text-xs)' }}>{label}</span>
      <span style={{ color: 'var(--text-main)', fontWeight: 700, flex: 1, textAlign: 'right', fontSize: 'var(--text-sm)', lineHeight: 1.45 }}>{value}</span>
    </div>
  );
}

function Block({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  const kids = Array.isArray(children)
    ? (children as any[]).flat().filter(Boolean)
    : [children].filter(Boolean);
  if (!kids.length) return null;
  return (
    <div style={{
      marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius-md)',
      overflow: 'hidden', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--glass-border)',
      }}>
        <span style={{ color: 'var(--color-primary)', opacity: 0.6, display: 'flex' }}>{icon}</span>
        <span style={{
          fontSize: 'var(--text-2xs)', fontWeight: 900,
          letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-tertiary)',
        }}>{title}</span>
      </div>
      <div style={{ padding: '0 var(--sp-4) var(--sp-1)' }}>{kids}</div>
    </div>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const col = pct >= 80 ? '#22c55e' : pct >= 50 ? 'var(--color-gold)' : 'var(--color-accent)';
  return (
    <div style={{
      marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius-md)',
      padding: 'var(--sp-3) var(--sp-4)',
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    }}>
      <div dir="rtl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>اكتمال الملف</span>
        <span style={{ color: col, fontWeight: 900, fontSize: 'var(--text-sm)' }}>{pct}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'var(--glass-border)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
          style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${col}80,${col})` }}
        />
      </div>
    </div>
  );
}

// ── زر فاخر 3D (متناسق مع usercard) ──────────────────────────
function ActionBtn3D({
  onClick, disabled, icon, label,
  variant,
}: {
  onClick:  () => void;
  disabled?: boolean;
  icon:     React.ReactNode;
  label:    string;
  variant:  'primary' | 'secondary' | 'liked';
}) {
  const styles = {
    primary: {
      bg:    'linear-gradient(145deg, #c8002c 0%, #8a0018 100%)',
      depth: 'rgba(50,0,10,0.7)',
      glow:  'rgba(192,0,42,0.4)',
      color: '#fff',
    },
    secondary: {
      bg:    'linear-gradient(145deg, var(--glass-bg) 0%, rgba(30,30,50,0.6) 100%)',
      depth: 'rgba(0,0,0,0.5)',
      glow:  'rgba(0,0,0,0.2)',
      color: '#7dd3fc',
    },
    liked: {
      bg:    'rgba(164,22,26,0.1)',
      depth: 'transparent',
      glow:  'transparent',
      color: 'rgba(200,50,70,0.8)',
    },
  }[variant];

  const boxShadow = variant === 'liked'
    ? '0 0 0 1px rgba(164,22,26,0.3)'
    : [
        `0 5px 0 ${styles.depth}`,
        `0 8px 24px ${styles.glow}`,
        'inset 0 1px 0 rgba(255,255,255,0.15)',
        'inset 0 -1px 0 rgba(0,0,0,0.2)',
      ].join(', ');

  return (
    <motion.button
      whileTap={{ scale: 0.9, y: variant !== 'liked' ? 4 : 0 }}
      whileHover={{ scale: disabled ? 1 : 1.03, y: variant !== 'liked' ? -1 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, height: 52,
        borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: styles.bg,
        border: variant === 'secondary' ? '1px solid rgba(56,189,248,0.25)' : 'none',
        boxShadow,
        color: styles.color,
        fontFamily: 'inherit', fontWeight: 700, fontSize: 'var(--text-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Highlight زجاجي */}
      {variant !== 'liked' && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          background: 'radial-gradient(ellipse at 40% 20%, rgba(255,255,255,0.14) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
      )}
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
//  المحتوى الداخلي (يحتاج Suspense)
// ══════════════════════════════════════════════════════════════
function ViewContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const userId       = searchParams.get('id') ?? '';

  const [profile,  setProfile]  = useState<any>(null);
  const [me,       setMe]       = useState<any>(null);
  const [liked,    setLiked]    = useState(false);
  const [liking,   setLiking]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [convId,   setConvId]   = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [blocked,  setBlocked]  = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [shared,   setShared]   = useState(false);

  // ── جلب المستخدم الحالي ──────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setMe(data.user);
    });
  }, []);

  // ── جلب بيانات الملف ─────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => {
        if (data) setProfile(data);
        setLoading(false);
      });
  }, [userId]);

  // ── حالة الإعجاب + تسجيل زيارة ──────────────────────────
  useEffect(() => {
    if (!me || !userId) return;
    supabase.from('likes').select('id')
      .eq('from_user', me.id).eq('to_user', userId).eq('action', 'like')
      .maybeSingle().then(({ data }) => { if (data) setLiked(true); });
    if (me.id !== userId) {
      supabase.from('likes').upsert(
        { from_user: me.id, to_user: userId, action: 'view' },
        { onConflict: 'from_user,to_user,action', ignoreDuplicates: true }
      );
    }
  }, [me, userId]);

  // ── إعجاب ────────────────────────────────────────────────
  const handleLike = async () => {
    if (!me || liking) return;
    setLiking(true);
    if (liked) {
      setLiked(false);
      await supabase.from('likes').delete()
        .eq('from_user', me.id).eq('to_user', userId).eq('action', 'like');
    } else {
      setLiked(true);
      await supabase.from('likes').upsert(
        { from_user: me.id, to_user: userId, action: 'like' },
        { onConflict: 'from_user,to_user,action', ignoreDuplicates: true }
      );
    }
    setLiking(false);
  };

  // ── فتح المحادثة ─────────────────────────────────────────
  const handleMessage = async () => {
    if (!me) return;
    const { data: ex } = await supabase.from('conversations').select('id')
      .or(`and(user_1.eq.${me.id},user_2.eq.${userId}),and(user_1.eq.${userId},user_2.eq.${me.id})`)
      .maybeSingle();
    const cid = ex?.id ?? (
      await supabase.from('conversations')
        .insert({ user_1: me.id, user_2: userId })
        .select('id').single()
    ).data?.id ?? null;
    setConvId(cid);
    setChatOpen(true);
  };

  // ── مشاركة ───────────────────────────────────────────────
  const pageUrl = () => `${window.location.origin}/view?id=${userId}`;

  const handleShare = async () => {
    setShowMenu(false);
    const url = pageUrl();
    if (navigator.share) {
      try { await navigator.share({ title: profile?.full_name ?? 'ZAWAJ AI', url }); }
      catch { await navigator.clipboard.writeText(url); }
    } else {
      await navigator.clipboard.writeText(url);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  const handleCopy = async () => {
    setShowMenu(false);
    await navigator.clipboard.writeText(pageUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // ── إبلاغ ────────────────────────────────────────────────
  const handleReport = async () => {
    if (!me) return;
    setShowMenu(false);
    await supabase.from('reports').insert({
      reporter_id: me.id, reported_id: userId,
      reason: 'بلاغ من صفحة الملف', status: 'pending',
    });
  };

  // ── حظر ─────────────────────────────────────────────────
  const handleBlock = async () => {
    if (!me) return;
    setShowMenu(false);
    await supabase.from('blocks').upsert(
      { blocker_id: me.id, blocked_id: userId },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
    );
    setBlocked(true);
    setTimeout(() => router.back(), 1200);
  };

  // ── Spinner ──────────────────────────────────────────────
  if (!userId || loading || !profile) return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-main)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid var(--glass-border)',
          borderTopColor: 'var(--color-primary)',
        }}
      />
    </div>
  );

  // ── بيانات مشتقة ─────────────────────────────────────────
  const isMale       = profile.gender === 'male';
  const gender       = isMale ? 'male' : 'female';
  const committed    = COMMITTED_LEVELS.includes(profile.religious_commitment ?? -1);
  const pct          = profile.profile_completion_percent ?? 0;
  const name         = profile.full_name ?? '—';
  const loc          = [profile.country, profile.city].filter(Boolean).join(' — ');
  const hw           = [
    profile.height ? `${profile.height} سم` : null,
    profile.weight ? `${profile.weight} كغ` : null,
  ].filter(Boolean).join(' · ') || null;
  const nat          = profile.country ? getNationality(profile.country, gender) : (profile.nationality ?? null);
  const maritalLabel = profile.marital_status       ? getMaritalLabel(profile.marital_status, gender)         : null;
  const eduLabel     = profile.education_level      ? getEducationLabel(profile.education_level)              : null;
  const religLabel   = profile.religious_commitment ? getReligiousLabel(profile.religious_commitment, gender) : null;
  const housingLabel = profile.housing_type         ? getHousingLabel(profile.housing_type)                   : null;
  const jobLabel     = profile.occupation_id        ? getSpecialtyLabel(profile.occupation_id, gender)        : null;
  const isOwn        = me?.id === userId;
  const blurred      = profile.is_photos_blurred;

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        paddingBottom: isOwn ? 24 : 'calc(var(--nav-h) + 80px)',
      }}>

        {/* ── TopBar ──────────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--sp-4)', height: 56,
          background: 'var(--bg-main)',
          borderBottom: '1px solid var(--glass-border)',
          backdropFilter: 'blur(12px)',
        }}>
          {/* رجوع */}
          <motion.button
            whileTap={{ scale: 0.84 }}
            onClick={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-main)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <ArrowRight size={18} />
          </motion.button>

          <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 'var(--text-base)' }}>
            {name}
          </span>

          {/* قائمة الخيارات */}
          <div style={{ position: 'relative' }}>
            <motion.button
              whileTap={{ scale: 0.84 }}
              onClick={() => setShowMenu(v => !v)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-tertiary)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {/* أيقونة ثلاث نقاط رأسية بـ lucide */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5"  r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="12" cy="19" r="1.5"/>
              </svg>
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.88, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.88, y: -8 }}
                    transition={{ duration: 0.14 }}
                    style={{
                      position: 'absolute', top: 44, left: 0, zIndex: 30,
                      background: 'var(--bg-main)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden', width: 176,
                      boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                    }}
                  >
                    {[
                      { label: shared ? 'تمت المشاركة' : 'مشاركة',    icon: <Share2   size={13}/>, color: 'var(--text-secondary)', action: handleShare },
                      { label: copied ? 'تم النسخ'     : 'نسخ الرابط', icon: <Copy     size={13}/>, color: 'var(--text-secondary)', action: handleCopy  },
                      { label: 'إبلاغ',                                 icon: <Flag     size={13}/>, color: '#f87171',               action: handleReport },
                      { label: blocked ? 'تم الحظر'    : 'حظر',        icon: <ShieldOff size={13}/>, color: '#fb923c',              action: handleBlock  },
                    ].map((item, i, arr) => (
                      <button key={i} onClick={item.action} style={{
                        width: '100%', padding: '11px 16px',
                        display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        borderBottom: i < arr.length - 1 ? '1px solid var(--glass-border)' : 'none',
                        color: item.color, fontFamily: 'inherit',
                        fontSize: 'var(--text-xs)', fontWeight: 600,
                      }}>
                        {item.icon}{item.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Hero ────────────────────────────────────────── */}
        <div dir="rtl" style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '32px 20px 20px', gap: 10,
        }}>
          {/* الصورة */}
          <motion.div
            whileTap={{ scale: blurred ? 1 : 0.94 }}
            onClick={() => !blurred && setLightbox(true)}
            style={{ position: 'relative', cursor: blurred ? 'default' : 'zoom-in' }}
          >
            <img
              src={profile.avatar_url || '/default-avatar.png'}
              alt={name}
              style={{
                width: 112, height: 112, borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--glass-border)',
                filter: blurred ? 'blur(14px)' : 'none',
                display: 'block',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              }}
            />
            <OnlineDot userId={userId} initialLastActive={profile.last_active_at} size={16} />
          </motion.div>

          {/* الاسم */}
          <span style={{
            color: 'var(--text-main)', fontWeight: 900,
            fontSize: 'var(--text-2xl)', textAlign: 'center',
            letterSpacing: '-0.01em',
          }}>
            {name}
          </span>

          {/* العمر + المدينة */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 12, flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {profile.age && (
              <span style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', fontWeight: 600,
              }}>
                {profile.age} سنة
              </span>
            )}
            {profile.city && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)',
              }}>
                <MapPin size={11} strokeWidth={2} /> {profile.city}
              </span>
            )}
          </div>
        </div>

        {/* فاصل */}
        <div style={{ height: 1, background: 'var(--glass-border)', margin: '0 var(--sp-4) var(--sp-4)' }} />

        {/* ── المحتوى ──────────────────────────────────────── */}
        <div style={{ padding: '0 var(--sp-4)' }}>

          <Block title="البيانات الأساسية" icon={<Users size={13}/>}>
            <Row icon={<Users size={13}/>}     label="الحالة المدنية" value={maritalLabel} />
            <Row icon={<Globe size={13}/>}      label="الجنسية"        value={nat} />
            <Row icon={<MapPin size={13}/>}     label="الإقامة"        value={loc} />
            <Row icon={<Ruler size={13}/>}      label="الطول / الوزن"  value={hw} />
            <Row icon={<Smile size={13}/>}      label="لون البشرة"     value={profile.skin_color} />
            <Row icon={<Globe size={13}/>}      label="الانتقال"       value={profile.travel_willingness} />
            <Row icon={<HandHeart size={13}/>}  label="نوع الزواج"     value={profile.marriage_type} />
          </Block>

          <Block title="المهنة والتعليم" icon={<Briefcase size={13}/>}>
            <Row icon={<Briefcase size={13}/>}     label="المهنة"          value={jobLabel} />
            <Row icon={<GraduationCap size={13}/>} label="المستوى الدراسي" value={eduLabel} />
            <Row icon={<Star size={13}/>}           label="الوضع المادي"    value={profile.financial_status} />
          </Block>

          <Block title="الأطفال" icon={<Baby size={13}/>}>
            <Row icon={<Baby size={13}/>} label="لديه أطفال"
              value={profile.has_children !== undefined
                ? (profile.has_children ? `نعم (${profile.children_count ?? 0})` : 'لا')
                : null}
            />
            {profile.has_children && <Row icon={<Users size={13}/>} label="الحضانة" value={profile.children_custody} />}
            <Row icon={<Baby size={13}/>} label="رغبة بالإنجاب" value={profile.desire_for_children} />
          </Block>

          <Block title="السكن" icon={<Home size={13}/>}>
            <Row icon={<Home size={13}/>} label="السكن الحالي" value={housingLabel} />
            <Row icon={<Home size={13}/>} label="بعد الزواج"   value={profile.preferred_housing} />
          </Block>

          <Block title="الدين والالتزام" icon={<Moon size={13}/>}>
            <Row icon={<Moon size={13}/>}     label="الالتزام"     value={religLabel} />
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
            <Row icon={<Smile size={13}/>}     label="الشخصية"         value={profile.social_type} />
            <Row icon={<Star size={13}/>}       label="صباحي / مسائي"   value={profile.morning_evening} />
            <Row icon={<Home size={13}/>}       label="وقت المنزل"      value={profile.home_time} />
            <Row icon={<Users size={13}/>}      label="أسلوب الحوار"    value={profile.conflict_style} />
            <Row icon={<HandHeart size={13}/>}  label="التعبير العاطفي" value={profile.affection_style} />
            <Row icon={<Users size={13}/>}      label="العلاقة بالأسرة" value={profile.relationship_with_family} />
            <Row icon={<Star size={13}/>}       label="أولويات الحياة"  value={profile.life_priority} />
            <Row icon={<Baby size={13}/>}       label="أسلوب التربية"   value={profile.parenting_style} />
          </Block>

          {!isMale && (
            <Block title="الزواج" icon={<HandHeart size={13}/>}>
              <Row icon={<Users size={13}/>}     label="قبول التعدد"      value={profile.polygamy_acceptance} />
              <Row icon={<Briefcase size={13}/>} label="العمل بعد الزواج" value={profile.work_after_marriage} />
            </Block>
          )}

          {!!profile.bio && (
            <div style={{
              marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius-md)',
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            }}>
              <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-2xs)', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  نبذة شخصية
                </span>
              </div>
              <p dir="rtl" style={{ padding: 'var(--sp-3) var(--sp-4)', margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.75 }}>
                {profile.bio}
              </p>
            </div>
          )}

          {!!profile.partner_requirements && (
            <div style={{
              marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius-md)',
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            }}>
              <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-2xs)', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  يبحث عن
                </span>
              </div>
              <p dir="rtl" style={{ padding: 'var(--sp-3) var(--sp-4)', margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.75 }}>
                {profile.partner_requirements}
              </p>
            </div>
          )}

          {pct > 0 && <CompletionBar pct={pct} />}
        </div>
      </div>

      {/* ══ أزرار التفاعل (للمستخدمين الآخرين فقط) ══════════ */}
      {!isOwn && me && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, type: 'spring', stiffness: 380, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: 'calc(var(--nav-h) + var(--sp-3))',
            left: 'var(--sp-4)', right: 'var(--sp-4)',
            zIndex: 100,
            display: 'flex', gap: 'var(--sp-3)',
          }}
        >
          <ActionBtn3D
            variant={liked ? 'liked' : 'primary'}
            onClick={handleLike}
            disabled={liking}
            icon={<Heart size={17} fill={liked ? 'rgba(200,50,70,0.8)' : '#fff'} color={liked ? 'rgba(200,50,70,0.8)' : '#fff'} />}
            label={liked ? 'أرسلت إعجاباً' : 'إعجاب'}
          />
          <ActionBtn3D
            variant="secondary"
            onClick={handleMessage}
            icon={<MessageCircle size={17} color="#7dd3fc" />}
            label="رسالة"
          />
        </motion.div>
      )}

      {/* ══ Lightbox ════════════════════════════════════════ */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9000,
              background: 'rgba(0,0,0,0.97)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'zoom-out',
            }}
          >
            <motion.img
              initial={{ scale: 0.82, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.82, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              src={profile.avatar_url || '/default-avatar.png'}
              alt={name}
              style={{
                maxWidth: '90vw', maxHeight: '88vh',
                borderRadius: 20, objectFit: 'contain',
                boxShadow: '0 40px 120px rgba(0,0,0,0.95)',
              }}
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ ChatWindow ══════════════════════════════════════ */}
      <AnimatePresence>
        {chatOpen && convId && profile && (
          <ChatWindow
            conversationId={convId}
            currentUserId={me!.id}
            recipient={{
              id:        profile.id,
              name:      profile.full_name ?? '—',
              avatar:    profile.avatar_url || '/default-avatar.png',
              role:      profile.role ?? 'user',
              last_seen: profile.last_active_at,
            }}
            onBack={() => setChatOpen(false)}
            onOpenProfile={() => {}}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
//  الصفحة — Suspense ضروري لـ useSearchParams
// ══════════════════════════════════════════════════════════════
export default function ViewPage() {
  return (
    <Suspense fallback={
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-main)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid var(--glass-border)',
            borderTopColor: 'var(--color-primary)',
          }}
        />
      </div>
    }>
      <ViewContent />
    </Suspense>
  );
}