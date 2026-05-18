'use client';
/**
 * 📁 app/profile/page.tsx — ZAWAJ AI
 * يقرأ userId من ?id=xxx — متوافق مع output: export
 * route من الإشعارات: /profile?id=USER_ID
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter }    from 'next/navigation';
import { motion, AnimatePresence }       from 'framer-motion';
import {
  ArrowRight, MoreVertical, Heart, Flag, ShieldOff, Copy,
  MapPin, Briefcase, GraduationCap, BookOpen, Baby, Home,
  Users, Activity, Flame, Moon, Star, Globe, Smile, Ruler,
  HandHeart, ShieldCheck, Check, Share2,
} from 'lucide-react';
import { supabase }     from '@/lib/supabase/client';
import { AutoBadge }    from '@/components/auto-badge';
import {
  COMMITTED_LEVELS, getNationality,
  getMaritalLabel, getEducationLabel,
  getReligiousLabel, getHousingLabel,
} from '@/constants/constants';
import { getSpecialtyLabel } from '@/constants/occupations';
import ChatWindow from '@/components/chat/ChatWindow';

// ── أيقونة تيليجرام ──────────────────────────────────────────
function TelegramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 13.947l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.993.612z"/>
    </svg>
  );
}

// ── حالة التواجد ──────────────────────────────────────────────
function getOnlineStatus(lastActiveAt?: string, gender?: string) {
  const f = gender === 'female';
  if (!lastActiveAt) return { text: f ? 'غير متصلة' : 'غير متصل', color: 'rgba(255,255,255,0.3)', dot: false };
  const mins = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 60000);
  if (mins < 5)  return { text: f ? 'متواجدة الآن' : 'متواجد الآن', color: '#22c55e', dot: true };
  if (mins < 60) return { text: `منذ ${mins} دقيقة`, color: 'rgba(255,255,255,0.5)', dot: false };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return { text: `منذ ${hrs} ساعة`, color: 'rgba(255,255,255,0.4)', dot: false };
  const days = Math.floor(hrs / 24);
  if (days < 7)  return { text: `منذ ${days} أيام`, color: 'rgba(255,255,255,0.3)', dot: false };
  return { text: f ? 'غير متصلة' : 'غير متصل', color: 'rgba(255,255,255,0.25)', dot: false };
}

function CompletionBar({ pct }: { pct: number }) {
  const col = pct >= 80 ? '#22c55e' : pct >= 50 ? 'var(--color-gold)' : 'var(--color-accent)';
  return (
    <div className="mb-3 rounded-[22px] px-4 py-3.5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
      <div className="flex justify-between items-center mb-2" dir="rtl">
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.66)' }}>اكتمال الملف</span>
        <span className="font-black" style={{ color: col, fontSize: 'calc(var(--base-font-size) * 0.75)' }}>{pct}%</span>
      </div>
      <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
          className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${col}80, ${col})` }} />
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center gap-3 py-[9px] border-b last:border-0" dir="rtl" style={{ borderColor: 'var(--glass-border)' }}>
      <span className="text-[14px] flex-shrink-0" style={{ color: 'var(--color-accent)', opacity: 0.75 }}>{icon}</span>
      <span className="flex-shrink-0 font-medium" style={{ color: 'var(--text-tertiary)', minWidth: 100, fontSize: 'calc(var(--base-font-size) * 0.69)' }}>{label}</span>
      <span className="font-bold flex-1 text-right leading-snug" style={{ color: 'var(--text-main)', fontSize: 'calc(var(--base-font-size) * 0.8)' }}>{value}</span>
    </div>
  );
}

function Block({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const kids = Array.isArray(children) ? (children as any[]).flat().filter(Boolean) : [children].filter(Boolean);
  if (!kids.length) return null;
  return (
    <div className="mb-3 rounded-[22px] overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-2.5" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <span className="text-[13px] flex-shrink-0" style={{ color: 'var(--color-accent)', opacity: 0.7 }}>{icon}</span>
        <span className="font-black tracking-[0.2em] uppercase" style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.59)' }}>{title}</span>
      </div>
      <div className="px-4 py-0.5">{kids}</div>
    </div>
  );
}

function ActionBtn({ onClick, icon, color, bg, border, active, disabled, size = 54 }: {
  onClick: () => void; icon: React.ReactNode; color: string; bg: string; border: string;
  active?: boolean; disabled?: boolean; size?: number;
}) {
  return (
    <motion.button whileTap={{ scale: disabled ? 1 : 0.85 }} whileHover={{ scale: disabled ? 1 : 1.08 }}
      onClick={onClick} disabled={disabled}
      style={{
        width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: bg, border: `1.5px solid ${border}`,
        cursor: disabled ? 'default' : 'pointer', color,
        transition: 'all 0.2s ease',
        boxShadow: active ? `0 0 20px ${color}66` : 'none',
        flexShrink: 0,
      }}>
      {icon}
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
// المكوّن الداخلي — يستخدم useSearchParams
// ══════════════════════════════════════════════════════════════
function ProfileContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const userId       = searchParams.get('id') ?? '';

  const [profile,  setProfile]  = useState<any>(null);
  const [badge,    setBadge]    = useState('');
  const [me,       setMe]       = useState<any>(null);
  const [liked,    setLiked]    = useState(false);
  const [liking,   setLiking]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [convId,   setConvId]   = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const [shared,   setShared]   = useState(false);
  const [blocked,  setBlocked]  = useState(false);
  const [reported, setReported] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setMe(data.user); });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const run = async () => {
      setLoading(true);
      const [profileRes, walletRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('wallets').select('badge_type,badge_expires_at').eq('id', userId).maybeSingle(),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (walletRes.data?.badge_type && walletRes.data.badge_type !== 'none') {
        const exp = walletRes.data.badge_expires_at;
        if (!exp || new Date(exp) > new Date()) setBadge(walletRes.data.badge_type);
      }
      setLoading(false);
    };
    run();
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

  const handleLike = async () => {
    if (!me || liking) return;
    setLiking(true);
    if (liked) {
      setLiked(false);
      await supabase.from('likes').delete().eq('from_user', me.id).eq('to_user', userId).eq('action', 'like');
    } else {
      setLiked(true);
      await supabase.from('likes').upsert(
        { from_user: me.id, to_user: userId, action: 'like' },
        { onConflict: 'from_user,to_user,action', ignoreDuplicates: true }
      );
    }
    setLiking(false);
  };

  const handleMessage = async () => {
    if (!me) return;
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

  const handleShare = async () => {
    const url = `${window.location.origin}/profile?id=${userId}`;
    if (navigator.share) {
      try { await navigator.share({ title: profile?.full_name ?? 'ZAWAJ AI', text: 'شاهد هذا الملف على ZAWAJ AI', url }); } catch (_) {}
    } else {
      await navigator.clipboard.writeText(url);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

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

  const handleReport = async () => {
    if (!me) return;
    setShowMenu(false);
    await supabase.from('reports').insert({ reporter_id: me.id, reported_id: userId, reason: 'بلاغ من صفحة الملف', status: 'pending' });
    setReported(true);
    setTimeout(() => setReported(false), 2000);
  };

  const handleCopy = () => {
    setShowMenu(false);
    navigator.clipboard.writeText(`${window.location.origin}/profile?id=${userId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!userId) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <span style={{ color: 'var(--text-tertiary)' }}>معرّف المستخدم مفقود</span>
    </div>
  );

  if (loading || !profile) return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid var(--color-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  const isMale      = profile.gender === 'male';
  const gender      = isMale ? 'male' : 'female';
  const committed   = COMMITTED_LEVELS.includes(profile.religious_commitment ?? -1);
  const pct         = profile.profile_completion_percent ?? 0;
  const name        = profile.full_name ?? '—';
  const status      = getOnlineStatus(profile.last_active_at, profile.gender);
  const loc         = [profile.country, profile.city].filter(Boolean).join(' — ');
  const hw          = [profile.height ? `${profile.height} سم` : null, profile.weight ? `${profile.weight} كغ` : null].filter(Boolean).join(' · ') || null;
  const maritalLabel  = profile.marital_status       ? getMaritalLabel(profile.marital_status, gender) : null;
  const eduLabel      = profile.education_level      ? getEducationLabel(profile.education_level) : null;
  const religionLabel = profile.religious_commitment ? getReligiousLabel(profile.religious_commitment, gender) : null;
  const housingLabel  = profile.housing_type         ? getHousingLabel(profile.housing_type) : null;
  const jobLabel      = profile.occupation_id        ? getSpecialtyLabel(profile.occupation_id, gender) : null;
  const nat           = profile.country ? getNationality(profile.country, gender) : (profile.nationality ?? null);
  const isOwn         = me?.id === userId;
  const NAV           = 62;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingBottom: isOwn ? 24 : NAV + 100 }}>

        {/* TopBar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: 56,
          background: 'var(--bg-main)', borderBottom: '1px solid var(--glass-border)',
        }}>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => router.back()}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
            <ArrowRight size={18} />
          </motion.button>

          <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 'calc(var(--base-font-size) * 0.95)' }}>{name}</span>

          <div style={{ position: 'relative' }}>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowMenu(v => !v)}
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
              <MoreVertical size={18} />
            </motion.button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowMenu(false)} />
                  <motion.div initial={{ opacity: 0, scale: 0.88, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.88, y: -8 }} transition={{ duration: 0.15 }}
                    style={{ position: 'absolute', top: 44, left: 0, zIndex: 20, background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 18, overflow: 'hidden', width: 168, boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>
                    {[
                      { label: reported ? 'تم الإبلاغ ✓' : 'إبلاغ',    icon: <Flag size={13}/>,     color: '#f87171', action: handleReport },
                      { label: blocked  ? 'تم الحظر ✓'  : 'حظر',       icon: <ShieldOff size={13}/>, color: '#fb923c', action: handleBlock },
                      { label: copied   ? 'تم النسخ ✓'  : 'نسخ الرابط', icon: <Copy size={13}/>,     color: 'var(--text-secondary)', action: handleCopy },
                    ].map((item, i) => (
                      <button key={i} onClick={item.action}
                        style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: i < 2 ? '1px solid var(--glass-border)' : 'none', color: item.color, fontFamily: 'inherit', fontSize: 'calc(var(--base-font-size) * 0.82)', fontWeight: 600 }}>
                        {item.icon}{item.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Hero */}
        <div style={{ padding: '28px 20px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }} dir="rtl">
          <motion.div whileTap={{ scale: 0.96 }}
            onClick={() => !profile.is_photos_blurred && setLightbox(true)}
            style={{ position: 'relative', cursor: profile.is_photos_blurred ? 'default' : 'pointer' }}>
            <img src={profile.avatar_url || '/default-avatar.png'} alt={name}
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--glass-border)', filter: profile.is_photos_blurred ? 'blur(12px)' : 'none' }} />
            {status.dot && (
              <div style={{ position: 'absolute', bottom: 4, left: 4, width: 14, height: 14, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--bg-main)' }} />
            )}
          </motion.div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'calc(var(--base-font-size) * 1.35)', textAlign: 'center' }}>{name}</span>
            {badge && <AutoBadge value={badge as any} isBroker={false} size="text-[10px]" />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {profile.age && <span style={{ color: 'var(--text-secondary)', fontSize: 'calc(var(--base-font-size) * 0.85)', fontWeight: 600 }}>{profile.age} سنة</span>}
            {profile.city && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.82)' }}><MapPin size={12} />{profile.city}</span>}
          </div>

          <span style={{ fontSize: 'calc(var(--base-font-size) * 0.75)', color: status.color, fontWeight: 500 }}>{status.text}</span>

          {/* أزرار الأكشن الدائرية */}
          {!isOwn && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ display: 'flex', gap: 24, marginTop: 10, alignItems: 'center' }}>
              <ActionBtn onClick={handleLike} disabled={liking}
                icon={<Heart size={21} fill={liked ? '#ef4444' : 'none'} strokeWidth={liked ? 0 : 1.8} />}
                color={liked ? '#ef4444' : 'rgba(255,255,255,0.45)'}
                bg={liked ? 'rgba(239,68,68,0.15)' : 'var(--glass-bg)'}
                border={liked ? 'rgba(239,68,68,0.4)' : 'var(--glass-border)'} active={liked} />

              <ActionBtn onClick={handleMessage}
                icon={<TelegramIcon size={21} />}
                color="#38bdf8" bg="rgba(56,189,248,0.12)" border="rgba(56,189,248,0.3)" />

              <ActionBtn onClick={handleShare}
                icon={shared ? <Check size={21} /> : <Share2 size={21} />}
                color={shared ? '#22c55e' : 'var(--color-primary)'}
                bg={shared ? 'rgba(34,197,94,0.12)' : 'var(--glass-bg)'}
                border={shared ? 'rgba(34,197,94,0.3)' : 'var(--glass-border)'} active={shared} />
            </motion.div>
          )}
        </div>

        {/* المحتوى */}
        <div style={{ padding: '16px 16px 0' }}>
          <Block title="البيانات الأساسية" icon={<Users size={13}/>}>
            <Row icon={<Users size={13}/>}      label="الحالة المدنية"  value={maritalLabel} />
            <Row icon={<Globe size={13}/>}       label="الجنسية"         value={nat} />
            <Row icon={<MapPin size={13}/>}      label="الإقامة"         value={loc} />
            <Row icon={<Ruler size={13}/>}       label="الطول / الوزن"   value={hw} />
            <Row icon={<Smile size={13}/>}       label="لون البشرة"      value={profile.skin_color} />
            <Row icon={<Globe size={13}/>}       label="الانتقال"        value={profile.travel_willingness} />
            <Row icon={<HandHeart size={13}/>}   label="نوع الزواج"      value={profile.marriage_type} />
          </Block>

          <Block title="المهنة والتعليم" icon={<Briefcase size={13}/>}>
            <Row icon={<Briefcase size={13}/>}    label="المهنة"           value={jobLabel} />
            <Row icon={<GraduationCap size={13}/>} label="المستوى الدراسي" value={eduLabel} />
            <Row icon={<Flame size={13}/>}         label="الوضع المادي"    value={profile.financial_status} />
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
            <div className="mb-3 rounded-[22px] overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.59)', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>نبذة شخصية</span>
              </div>
              <p className="px-4 py-3 leading-[1.75]" dir="rtl" style={{ color: 'var(--text-secondary)', fontSize: 'calc(var(--base-font-size) * 0.81)' }}>"{profile.bio}"</p>
            </div>
          )}

          {profile.partner_requirements && (
            <div className="mb-3 rounded-[22px] overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.59)', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>يبحث عن</span>
              </div>
              <p className="px-4 py-3 leading-[1.75]" dir="rtl" style={{ color: 'var(--text-secondary)', fontSize: 'calc(var(--base-font-size) * 0.81)' }}>{profile.partner_requirements}</p>
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
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
            <motion.img initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              src={profile.avatar_url || '/default-avatar.png'} alt={name}
              style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 20, objectFit: 'contain', boxShadow: '0 30px 80px rgba(0,0,0,0.8)' }}
              onClick={e => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

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
// Export مع Suspense — مطلوب لـ useSearchParams مع static export
// ══════════════════════════════════════════════════════════════
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid var(--color-accent)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}