'use client';
/**
 * 📁 components/profile/ProfileModal.tsx
 * ZAWAJ AI — نافذة الملف الكاملة
 * تُستدعى من: usercard · notifications · likes · chat
 * تستقبل: userId فقط — تجلب البيانات داخلياً
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, MoreVertical, Heart, MessageCircle, Share2,
  Flag, ShieldOff, Copy, MapPin, Briefcase, GraduationCap,
  BookOpen, Baby, Home, Users, Activity, Flame, Moon,
  Star, Globe, Smile, Ruler, HandHeart, ShieldCheck,
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

const NAV = 62;

// ── حالة التواجد ──────────────────────────────────────────────
function getOnlineStatus(lastActiveAt?: string, gender?: string) {
  const isFemale = gender === 'female';
  if (!lastActiveAt) return {
    text: isFemale ? 'غير متصلة' : 'غير متصل',
    color: 'rgba(255,255,255,0.3)',
  };
  const mins = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 60000);
  if (mins < 5)  return { text: isFemale ? 'متواجدة الآن' : 'متواجد الآن', color: '#22c55e' };
  if (mins < 60) return { text: `منذ ${mins} دقيقة`, color: 'rgba(255,255,255,0.5)' };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return { text: `منذ ${hrs} ساعة`, color: 'rgba(255,255,255,0.45)' };
  const days = Math.floor(hrs / 24);
  if (days < 7)  return { text: `منذ ${days} أيام`, color: 'rgba(255,255,255,0.3)' };
  return { text: isFemale ? 'غير متصلة' : 'غير متصل', color: 'rgba(255,255,255,0.3)' };
}

// ── شريط اكتمال الملف ──────────────────────────────────────────
function CompletionBar({ pct }: { pct: number }) {
  const col = pct >= 80 ? '#22c55e' : pct >= 50 ? 'var(--color-gold)' : 'var(--color-accent)';
  return (
    <div className="mb-3 rounded-[22px] px-4 py-3.5" style={{
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    }}>
      <div className="flex justify-between items-center mb-2" dir="rtl">
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.66)' }}>
          اكتمال الملف
        </span>
        <span className="font-black" style={{ color: col, fontSize: 'calc(var(--base-font-size) * 0.75)' }}>
          {pct}%
        </span>
      </div>
      <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${col}80, ${col})` }}
        />
      </div>
    </div>
  );
}

// ── صف معلومة واحدة ───────────────────────────────────────────
function Row({ icon, label, value }: {
  icon: React.ReactNode; label: string; value?: string | number | null;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center gap-3 py-[9px] border-b last:border-0" dir="rtl"
      style={{ borderColor: 'var(--glass-border)' }}>
      <span className="text-[14px] flex-shrink-0" style={{ color: 'var(--color-accent)', opacity: 0.75 }}>
        {icon}
      </span>
      <span className="flex-shrink-0 font-medium" style={{
        color: 'var(--text-tertiary)', minWidth: 100,
        fontSize: 'calc(var(--base-font-size) * 0.69)',
      }}>
        {label}
      </span>
      <span className="font-bold flex-1 text-right leading-snug" style={{
        color: 'var(--text-main)',
        fontSize: 'calc(var(--base-font-size) * 0.8)',
      }}>
        {value}
      </span>
    </div>
  );
}

// ── بلوك قسم ──────────────────────────────────────────────────
function Block({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  const kids = Array.isArray(children)
    ? (children as any[]).flat().filter(Boolean)
    : [children].filter(Boolean);
  if (!kids.length) return null;
  return (
    <div className="mb-3 rounded-[22px] overflow-hidden" style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-soft)',
    }}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-2.5"
        style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <span className="text-[13px] flex-shrink-0" style={{ color: 'var(--color-accent)', opacity: 0.7 }}>
          {icon}
        </span>
        <span className="font-black tracking-[0.2em] uppercase" style={{
          color: 'var(--text-tertiary)',
          fontSize: 'calc(var(--base-font-size) * 0.59)',
        }}>
          {title}
        </span>
      </div>
      <div className="px-4 py-0.5">{kids}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Props
// ══════════════════════════════════════════════════════════════
export interface ProfileModalProps {
  userId: string;
  currentUser: { id: string; gender?: string } | null;
  onClose: () => void;
}

// ══════════════════════════════════════════════════════════════
//  المكوّن الرئيسي
// ══════════════════════════════════════════════════════════════
export default function ProfileModal({ userId, currentUser, onClose }: ProfileModalProps) {
  const [profile,     setProfile]     = useState<any>(null);
  const [badge,       setBadge]       = useState<string>('');
  const [liked,       setLiked]       = useState(false);
  const [liking,      setLiking]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [showMenu,    setShowMenu]    = useState(false);
  const [chatOpen,    setChatOpen]    = useState(false);
  const [convId,      setConvId]      = useState<string | null>(null);
  const [showShare,   setShowShare]   = useState(false);
  const [mediators,   setMediators]   = useState<any[]>([]);
  const [shareLoading,setShareLoading]= useState<string | null>(null);
  const [shareDone,   setShareDone]   = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);

  // ── جلب البيانات ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const run = async () => {
      setLoading(true);

      const [profileRes, walletRes, likedRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('wallets').select('badge_type, badge_expires_at').eq('id', userId).maybeSingle(),
        currentUser
          ? supabase.from('likes')
              .select('id').eq('from_user', currentUser.id)
              .eq('to_user', userId).eq('action', 'like').maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (walletRes.data?.badge_type && walletRes.data.badge_type !== 'none') {
        const exp = walletRes.data.badge_expires_at;
        if (!exp || new Date(exp) > new Date()) setBadge(walletRes.data.badge_type);
      }
      if (likedRes.data) setLiked(true);
      setLoading(false);
    };
    run();
  }, [userId, currentUser]);

  // ── جلب الوسطاء عند فتح نافذة المشاركة ─────────────────────
  useEffect(() => {
    if (!showShare || !currentUser || mediators.length) return;
    const fetchMediators = async () => {
      const { data: subs } = await supabase
        .from('mediator_subscriptions')
        .select('mediator_id')
        .eq('id', currentUser.id)
        .eq('status', 'active');
      if (!subs?.length) return;
      const ids = subs.map((s: any) => s.mediator_id);
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', ids);
      setMediators(profs ?? []);
    };
    fetchMediators();
  }, [showShare, currentUser, mediators.length]);

  // ── إعجاب ──────────────────────────────────────────────────
  const handleLike = async () => {
    if (!currentUser || liked || liking) return;
    setLiking(true);
    setLiked(true);
    const { error } = await supabase.from('likes').upsert(
      { from_user: currentUser.id, to_user: userId, action: 'like' },
      { onConflict: 'from_user,to_user,action', ignoreDuplicates: true }
    );
    if (error) setLiked(false);
    setLiking(false);
  };

  // ── فتح المحادثة ───────────────────────────────────────────
  const handleMessage = async () => {
    if (!currentUser) return;
    // بحث عن محادثة موجودة
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(user_1.eq.${currentUser.id},user_2.eq.${userId}),` +
        `and(user_1.eq.${userId},user_2.eq.${currentUser.id})`
      )
      .maybeSingle();

    if (existing) {
      setConvId(existing.id);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ user_1: currentUser.id, user_2: userId })
        .select('id').single();
      setConvId(newConv?.id ?? null);
    }
    setChatOpen(true);
  };

  // ── مشاركة مع وسيط ────────────────────────────────────────
  const handleShareWithMediator = async (mediatorId: string) => {
    if (!currentUser || !profile) return;
    setShareLoading(mediatorId);

    // بحث/إنشاء محادثة مع الوسيط
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(user_1.eq.${currentUser.id},user_2.eq.${mediatorId}),` +
        `and(user_1.eq.${mediatorId},user_2.eq.${currentUser.id})`
      )
      .maybeSingle();

    let cid: string;
    if (existing) {
      cid = existing.id;
    } else {
      const { data: nc } = await supabase
        .from('conversations')
        .insert({ user_1: currentUser.id, user_2: mediatorId })
        .select('id').single();
      cid = nc?.id;
    }

    // إرسال رسالة مع بيانات الملف
    const name  = profile.full_name ?? '—';
    const age   = profile.age ?? '—';
    const city  = profile.city ?? '';
    const country = profile.country ?? '';
    const loc   = [city, country].filter(Boolean).join(' — ');
    const msg   = `📋 مشاركة ملف مرشح\n👤 ${name}\n🎂 ${age} سنة\n📍 ${loc}`;

    await supabase.from('messages').insert({
      conversation_id: cid,
      sender_id: currentUser.id,
      content: msg,
    });
    await supabase.from('conversations')
      .update({ last_message: msg, last_message_time: new Date().toISOString() })
      .eq('id', cid);

    setShareLoading(null);
    setShareDone(mediatorId);
    setTimeout(() => { setShareDone(null); setShowShare(false); }, 1500);
  };

  // ── إبلاغ ──────────────────────────────────────────────────
  const handleReport = async () => {
    if (!currentUser) return;
    setShowMenu(false);
    await supabase.from('reports').insert({
      reporter_id: currentUser.id,
      reported_id: userId,
      reason: 'بلاغ من صفحة الملف',
      status: 'pending',
    });
  };

  // ── حظر ───────────────────────────────────────────────────
  const handleBlock = async () => {
    if (!currentUser) return;
    setShowMenu(false);
    await supabase.from('likes').upsert(
      { from_user: currentUser.id, to_user: userId, action: 'block' },
      { onConflict: 'from_user,to_user,action' }
    );
    onClose();
  };

  // ── نسخ الرابط ─────────────────────────────────────────────
  const handleCopy = () => {
    setShowMenu(false);
    const url = `${window.location.origin}/profile?id=${userId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading || !profile) return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4000,
      background: 'var(--bg-main)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2.5px solid var(--color-accent)',
          borderTopColor: 'transparent',
        }}
      />
    </div>
  );

  // ── بيانات مشتقة ─────────────────────────────────────────
  const isMale    = profile.gender === 'male';
  const gender    = isMale ? 'male' : 'female';
  const committed = COMMITTED_LEVELS.includes(profile.religious_commitment ?? -1);
  const pct       = profile.profile_completion_percent ?? 0;
  const name      = profile.full_name ?? '—';
  const status    = getOnlineStatus(profile.last_active_at, profile.gender);
  const loc       = [profile.country, profile.city].filter(Boolean).join(' — ');
  const hw        = [
    profile.height ? `${profile.height} سم` : null,
    profile.weight ? `${profile.weight} كغ` : null,
  ].filter(Boolean).join(' · ') || null;

  const maritalLabel  = profile.marital_status       ? getMaritalLabel(profile.marital_status, gender)          : null;
  const eduLabel      = profile.education_level      ? getEducationLabel(profile.education_level)               : null;
  const religionLabel = profile.religious_commitment ? getReligiousLabel(profile.religious_commitment, gender)  : null;
  const housingLabel  = profile.housing_type         ? getHousingLabel(profile.housing_type)                    : null;
  const jobLabel      = profile.occupation_id        ? getSpecialtyLabel(profile.occupation_id, gender)         : null;
  const nat           = profile.country ? getNationality(profile.country, gender) : (profile.nationality ?? null);
  const isOwn         = currentUser?.id === userId;

  return (
    <>
      {/* ══ النافذة الرئيسية ══════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 4000,
          background: 'var(--bg-main)',
          overflowY: 'auto', overflowX: 'hidden',
          scrollbarWidth: 'none',
          paddingBottom: isOwn ? 24 : NAV + 90,
        }}
      >

        {/* ── TopBar ────────────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: 56,
          background: 'var(--bg-main)',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          {/* رجوع */}
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose}
            style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-main)',
            }}>
            <ArrowRight size={18} />
          </motion.button>

          {/* اسم مختصر في الوسط */}
          <span style={{
            color: 'var(--text-main)', fontWeight: 700,
            fontSize: 'calc(var(--base-font-size) * 0.95)',
          }}>
            {name}
          </span>

          {/* ثلاث نقاط */}
          <div style={{ position: 'relative' }}>
            <motion.button whileTap={{ scale: 0.85 }}
              onClick={() => setShowMenu(v => !v)}
              style={{
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                borderRadius: '50%', width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-tertiary)',
              }}>
              <MoreVertical size={18} />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.88, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.88, y: -8 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', top: 44, left: 0, zIndex: 20,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 18, overflow: 'hidden', width: 168,
                      boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                    }}
                  >
                    {[
                      { label: 'إبلاغ',      icon: <Flag size={13}/>,    color: '#f87171', action: handleReport },
                      { label: 'حظر',        icon: <ShieldOff size={13}/>, color: '#fb923c', action: handleBlock },
                      { label: copied ? 'تم النسخ ✓' : 'نسخ الرابط', icon: <Copy size={13}/>, color: 'var(--text-secondary)', action: handleCopy },
                    ].map((item, i) => (
                      <button key={i} onClick={item.action}
                        style={{
                          width: '100%', padding: '12px 16px',
                          display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          borderBottom: i < 2 ? '1px solid var(--glass-border)' : 'none',
                          color: item.color, fontFamily: 'inherit',
                          fontSize: 'calc(var(--base-font-size) * 0.82)', fontWeight: 600,
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

        {/* ── Hero: صورة + اسم + بادج + حالة ──────────────── */}
        <div style={{ padding: '24px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }} dir="rtl">
          {/* الصورة */}
          <div style={{ position: 'relative' }}>
            <img
              src={profile.avatar_url || '/default-avatar.png'}
              alt={name}
              style={{
                width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
                border: '3px solid var(--glass-border)',
                filter: profile.is_photos_blurred ? 'blur(12px)' : 'none',
              }}
            />
            {/* نقطة التواجد */}
            {status.color === '#22c55e' && (
              <div style={{
                position: 'absolute', bottom: 4, left: 4,
                width: 14, height: 14, borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid var(--bg-main)',
              }} />
            )}
          </div>

          {/* الاسم + البادج */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{
              color: 'var(--text-main)', fontWeight: 900,
              fontSize: 'calc(var(--base-font-size) * 1.35)',
              textAlign: 'center',
            }}>
              {name}
            </span>
            {badge && (
              <AutoBadge value={badge as any} isBroker={false} size="text-[10px]" />
            )}
          </div>

          {/* العمر + المدينة */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {profile.age && (
              <span style={{ color: 'var(--text-secondary)', fontSize: 'calc(var(--base-font-size) * 0.85)', fontWeight: 600 }}>
                {profile.age} سنة
              </span>
            )}
            {profile.city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.82)' }}>
                <MapPin size={12} /> {profile.city}
              </span>
            )}
          </div>

          {/* حالة التواجد */}
          <span style={{ fontSize: 'calc(var(--base-font-size) * 0.75)', color: status.color, fontWeight: 500 }}>
            {status.text}
          </span>
        </div>

        {/* ── المحتوى ──────────────────────────────────────── */}
        <div style={{ padding: '0 16px' }}>

          <Block title="البيانات الأساسية" icon={<Users size={13}/>}>
            <Row icon={<Users size={13}/>}      label="الحالة المدنية"  value={maritalLabel} />
            <Row icon={<Globe size={13}/>}       label="الجنسية"         value={nat} />
            <Row icon={<MapPin size={13}/>}      label="الإقامة"         value={loc} />
            <Row icon={<Ruler size={13}/>}       label="الطول / الوزن"   value={hw} />
            <Row icon={<Smile size={13}/>}       label="لون البشرة"      value={profile.skin_color} />
            <Row icon={<Activity size={13}/>}    label="جاهزية الزواج"   value={profile.readiness_level === 81 ? '🟢 جاهز حالاً' : null} />
            <Row icon={<Globe size={13}/>}       label="الانتقال"        value={profile.travel_willingness} />
            <Row icon={<HandHeart size={13}/>}   label="نوع الزواج"      value={profile.marriage_type} />
          </Block>

          <Block title="المهنة والتعليم" icon={<Briefcase size={13}/>}>
            <Row icon={<Briefcase size={13}/>}   label="المهنة"          value={jobLabel} />
            <Row icon={<Star size={13}/>}         label="نوع العمل"       value={profile.employment_type} />
            <Row icon={<GraduationCap size={13}/>} label="المستوى الدراسي" value={eduLabel} />
            <Row icon={<Flame size={13}/>}        label="الوضع المادي"    value={profile.financial_status} />
          </Block>

          <Block title="الأطفال" icon={<Baby size={13}/>}>
            <Row icon={<Baby size={13}/>} label="لديه أطفال"
              value={profile.has_children !== undefined
                ? (profile.has_children ? `نعم (${profile.children_count ?? 0})` : 'لا')
                : null}
            />
            {profile.has_children && (
              <Row icon={<Users size={13}/>} label="الحضانة" value={profile.children_custody} />
            )}
            <Row icon={<Baby size={13}/>}   label="رغبة بالإنجاب" value={profile.desire_for_children} />
          </Block>

          <Block title="السكن" icon={<Home size={13}/>}>
            <Row icon={<Home size={13}/>}       label="السكن الحالي"    value={housingLabel} />
            <Row icon={<Home size={13}/>}       label="بعد الزواج"      value={profile.preferred_housing} />
          </Block>

          <Block title="الدين والالتزام" icon={<Moon size={13}/>}>
            <Row icon={<Moon size={13}/>}       label="الالتزام"        value={religionLabel} />
            <Row icon={<BookOpen size={13}/>}   label="حفظ القرآن"      value={profile.quran_memorization} />
            {isMale && committed && <>
              <Row icon={<Star size={13}/>}     label="اللحية"          value={profile.beard_style} />
              <Row icon={<Activity size={13}/>} label="صلاة الجماعة"    value={profile.prayer_commitment} />
            </>}
            {!isMale && committed && (
              <Row icon={<ShieldCheck size={13}/>} label="اللباس"       value={profile.hijab_style} />
            )}
          </Block>

          <Block title="الصحة والعادات" icon={<Activity size={13}/>}>
            <Row icon={<Activity size={13}/>}   label="الحالة الصحية"  value={profile.health_status} />
            {isMale && <Row icon={<Flame size={13}/>} label="التدخين"   value={profile.smoking} />}
          </Block>

          <Block title="الطبع والشخصية" icon={<Smile size={13}/>}>
            <Row icon={<Smile size={13}/>}      label="الشخصية"         value={profile.social_type} />
            <Row icon={<Star size={13}/>}        label="صباحي / مسائي"   value={profile.morning_evening} />
            <Row icon={<Home size={13}/>}        label="وقت المنزل"      value={profile.home_time} />
            <Row icon={<Users size={13}/>}       label="أسلوب الحوار"    value={profile.conflict_style} />
            <Row icon={<HandHeart size={13}/>}   label="التعبير العاطفي" value={profile.affection_style} />
            <Row icon={<Users size={13}/>}       label="العلاقة بالأسرة" value={profile.relationship_with_family} />
            <Row icon={<Star size={13}/>}        label="أولويات الحياة"  value={profile.life_priority} />
            <Row icon={<Baby size={13}/>}        label="أسلوب التربية"   value={profile.parenting_style} />
          </Block>

          {!isMale && (
            <Block title="الزواج" icon={<HandHeart size={13}/>}>
              <Row icon={<Users size={13}/>}    label="قبول التعدد"      value={profile.polygamy_acceptance} />
              <Row icon={<Briefcase size={13}/>} label="العمل بعد الزواج" value={profile.work_after_marriage} />
            </Block>
          )}

          {profile.bio && (
            <div className="mb-3 rounded-[22px] overflow-hidden" style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            }}>
              <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.59)', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  نبذة شخصية
                </span>
              </div>
              <p className="px-4 py-3 leading-[1.75]" dir="rtl" style={{
                color: 'var(--text-secondary)', fontSize: 'calc(var(--base-font-size) * 0.81)',
              }}>
                "{profile.bio}"
              </p>
            </div>
          )}

          {profile.partner_requirements && (
            <div className="mb-3 rounded-[22px] overflow-hidden" style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            }}>
              <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.59)', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  يبحث عن
                </span>
              </div>
              <p className="px-4 py-3 leading-[1.75]" dir="rtl" style={{
                color: 'var(--text-secondary)', fontSize: 'calc(var(--base-font-size) * 0.81)',
              }}>
                {profile.partner_requirements}
              </p>
            </div>
          )}

          {pct > 0 && <CompletionBar pct={pct} />}
        </div>
      </motion.div>

      {/* ══ أزرار الأسفل (مخفية إن كان ملف المستخدم نفسه) ══ */}
      {!isOwn && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 350, damping: 28 }}
          style={{
            position: 'fixed', bottom: NAV + 12, left: 16, right: 16, zIndex: 4100,
            display: 'flex', gap: 10,
          }}
        >
          {/* زر الإعجاب */}
          <motion.button
            whileTap={{ scale: liked ? 1 : 0.88 }}
            onClick={handleLike}
            disabled={liked || liking}
            style={{
              flex: 1, height: 52, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: liked
                ? 'rgba(164,22,26,0.15)'
                : 'linear-gradient(135deg,rgba(164,22,26,0.6),rgba(164,22,26,0.9))',
              border: liked ? '1px solid rgba(164,22,26,0.4)' : 'none',
              cursor: liked ? 'default' : 'pointer',
              boxShadow: liked ? 'none' : '0 4px 20px rgba(164,22,26,0.45)',
              color: liked ? 'rgba(164,22,26,0.7)' : '#fff',
              fontFamily: 'inherit', fontWeight: 700,
              fontSize: 'calc(var(--base-font-size) * 0.85)',
              transition: 'all 0.25s ease',
            }}
          >
            <Heart size={17} fill={liked ? 'rgba(164,22,26,0.7)' : 'none'} />
            {liked ? 'أرسلت إعجاباً' : 'إعجاب'}
          </motion.button>

          {/* زر الرسالة */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleMessage}
            style={{
              flex: 1, height: 52, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.3)',
              cursor: 'pointer', color: '#7dd3fc',
              fontFamily: 'inherit', fontWeight: 700,
              fontSize: 'calc(var(--base-font-size) * 0.85)',
            }}
          >
            <MessageCircle size={17} />
            رسالة
          </motion.button>

          {/* زر المشاركة */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowShare(true)}
            style={{
              width: 52, height: 52, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer', color: 'var(--color-primary)',
            }}
          >
            <Share2 size={17} />
          </motion.button>
        </motion.div>
      )}

      {/* ══ نافذة المشاركة مع وسيط ═══════════════════════════ */}
      <AnimatePresence>
        {showShare && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 4200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
              onClick={() => setShowShare(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 4300,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)',
                borderRadius: '28px 28px 0 0',
                padding: '20px 20px 40px',
              }}
              dir="rtl"
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 40, height: 3, borderRadius: 2, background: 'var(--glass-border)', margin: '0 auto 16px' }} />
                <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 'calc(var(--base-font-size) * 0.95)' }}>
                  مشاركة مع وسيط
                </span>
              </div>

              {mediators.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0', fontSize: 'calc(var(--base-font-size) * 0.85)' }}>
                  لا يوجد وسطاء مشتركون حالياً
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {mediators.map(m => (
                    <motion.button
                      key={m.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleShareWithMediator(m.id)}
                      disabled={!!shareLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 16,
                        background: shareDone === m.id ? 'rgba(34,197,94,0.15)' : 'var(--glass-bg)',
                        border: `1px solid ${shareDone === m.id ? 'rgba(34,197,94,0.4)' : 'var(--glass-border)'}`,
                        cursor: shareLoading ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <img src={m.avatar_url || '/default-avatar.png'}
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                      <span style={{ color: 'var(--text-main)', fontWeight: 600, flex: 1, textAlign: 'right', fontSize: 'calc(var(--base-font-size) * 0.88)' }}>
                        {m.full_name}
                      </span>
                      {shareLoading === m.id && (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}
                          style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
                      )}
                      {shareDone === m.id && (
                        <span style={{ color: '#22c55e', fontSize: 12 }}>✓ تم</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ نافذة الدردشة فوق ProfileModal ══════════════════════ */}
      <AnimatePresence>
        {chatOpen && convId && profile && (
          <ChatWindow
            conversationId={convId}
            currentUserId={currentUser!.id}
            recipient={{
              id: profile.id,
              name: profile.full_name ?? '—',
              avatar: profile.avatar_url || '/default-avatar.png',
              role: profile.role ?? 'user',
              last_seen: profile.last_active_at,
            }}
            onBack={() => setChatOpen(false)}
            onOpenProfile={() => {}} // نحن داخل الملف مسبقاً
          />
        )}
      </AnimatePresence>
    </>
  );
}