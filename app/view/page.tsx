'use client';
/**
 * 📁 app/view/page.tsx — ZAWAJ AI
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter }    from 'next/navigation';
import { motion, AnimatePresence }       from 'framer-motion';
import {
  MapPin, Briefcase, GraduationCap, BookOpen, Baby, Home,
  Users, Activity, Flame, Moon, Star, Globe, Smile, Ruler,
  HandHeart, ShieldCheck,
} from 'lucide-react';
import { supabase }        from '@/lib/supabase/client';
import { AutoBadge }       from '@/components/auto-badge';
import ProfileActions      from '@/components/profile/ProfileActions';
import OnlineDot           from '@/components/profile/OnlineDot';
import {
  COMMITTED_LEVELS, getNationality,
  getMaritalLabel, getEducationLabel,
  getReligiousLabel, getHousingLabel,
} from '@/constants/constants';
import { getSpecialtyLabel } from '@/constants/occupations';
import ChatWindow from '@/components/chat/ChatWindow';

// ── صف معلومة ────────────────────────────────────────────────
function Row({ icon, label, value }: {
  icon: React.ReactNode; label: string; value?: string | number | null;
}) {
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

function Block({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  const kids = Array.isArray(children)
    ? (children as any[]).flat().filter(Boolean)
    : [children].filter(Boolean);
  if (!kids.length) return null;
  return (
    <div className="mb-3 rounded-[20px] overflow-hidden"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-2"
        style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <span style={{ color: 'var(--color-accent)', opacity: 0.65, display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 'calc(var(--base-font-size) * 0.58)', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
          {title}
        </span>
      </div>
      <div className="px-4 pb-1">{kids}</div>
    </div>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const col = pct >= 80 ? '#22c55e' : pct >= 50 ? 'var(--color-gold)' : 'var(--color-accent)';
  return (
    <div className="mb-3 rounded-[20px] px-4 py-3"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
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
function ViewContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const userId       = searchParams.get('id') ?? '';

  const [profile,   setProfile]   = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [badge,     setBadge]     = useState('');
  const [me,        setMe]        = useState<any>(null);
  const [liked,     setLiked]     = useState(false);
  const [liking,    setLiking]    = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [chatOpen,  setChatOpen]  = useState(false);
  const [convId,    setConvId]    = useState<string | null>(null);
  const [shared,    setShared]    = useState(false);
  const [blocked,   setBlocked]   = useState(false);
  const [msgFlash,  setMsgFlash]  = useState(false);
  const [lightbox,  setLightbox]  = useState(false);

  // ── جلب المستخدم الحالي + ملفه ──────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setMe(data.user);
      const { data: mp } = await supabase
        .from('profiles').select('show_photos').eq('id', data.user.id).single();
      setMyProfile(mp);
    });
  }, []);

  // ── جلب بيانات الملف المستهدف ────────────────────────────────
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

  // ── حالة الإعجاب + تسجيل زيارة ──────────────────────────────
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

  // ── إعجاب ────────────────────────────────────────────────────
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

  // ── رسالة ────────────────────────────────────────────────────
  const handleMessage = async () => {
    if (!me) return;
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

  // ── مشاركة ───────────────────────────────────────────────────
  const handleShare = async () => {
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

  // ── حظر ──────────────────────────────────────────────────────
  const handleBlock = async () => {
    if (!me) return;
    await supabase.from('blocks').upsert(
      { blocker_id: me.id, blocked_id: userId },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
    );
    setBlocked(true);
    setTimeout(() => router.back(), 1200);
  };

  // ── Loading ───────────────────────────────────────────────────
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
  const loc         = [profile.country, profile.city].filter(Boolean).join(' — ');
  const hw          = [profile.height ? `${profile.height} سم` : null, profile.weight ? `${profile.weight} كغ` : null].filter(Boolean).join(' · ') || null;
  const maritalLabel  = profile.marital_status       ? getMaritalLabel(profile.marital_status, gender)         : null;
  const eduLabel      = profile.education_level      ? getEducationLabel(profile.education_level)              : null;
  const religionLabel = profile.religious_commitment ? getReligiousLabel(profile.religious_commitment, gender) : null;
  const housingLabel  = profile.housing_type         ? getHousingLabel(profile.housing_type)                   : null;
  const jobLabel      = profile.occupation_id        ? getSpecialtyLabel(profile.occupation_id, gender)        : null;
  const nat           = profile.country ? getNationality(profile.country, gender) : (profile.nationality ?? null);
  const isOwn         = me?.id === userId;

  // ── منطق الضبابية ────────────────────────────────────────────
  const photoBlurred = profile.is_photos_blurred || (myProfile?.show_photos === false);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26 }}
        style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingBottom: isOwn ? 24 : 110 }}>

        {/* ── Hero ────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '28px 20px 20px', gap: 10,
        }} dir="rtl">

          {/* الصورة + نقطة الاتصال */}
          <motion.div whileTap={{ scale: 0.94 }}
            onClick={() => !photoBlurred && setLightbox(true)}
            style={{ position: 'relative', cursor: photoBlurred ? 'default' : 'pointer' }}>

            <img
              src={profile.avatar_url || '/default-avatar.png'}
              alt={name}
              style={{
                width: 108, height: 108, borderRadius: '50%',
                objectFit: 'cover',
                border: '2.5px solid var(--glass-border)',
                filter: photoBlurred ? 'blur(14px)' : 'none',
                display: 'block',
              }}
            />

            {/* OnlineDot — يحدّث نفسه كل دقيقة */}
            <OnlineDot
              userId={userId}
              initialLastActive={profile.last_active_at}
              size={16}
            />
          </motion.div>

          {/* الاسم + البادج */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'calc(var(--base-font-size) * 1.3)', textAlign: 'center', letterSpacing: '-0.01em' }}>
              {name}
            </span>
            {badge && <AutoBadge value={badge as any} isBroker={false} size="text-[10px]" />}
          </div>

          {/* العمر + المدينة */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {profile.age && (
              <span style={{ color: 'var(--text-secondary)', fontSize: 'calc(var(--base-font-size) * 0.84)', fontWeight: 600 }}>
                {profile.age} سنة
              </span>
            )}
            {profile.city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * 0.8)' }}>
                <MapPin size={11} /> {profile.city}
              </span>
            )}
          </div>

          {/* ProfileActions — مكون مستقل */}
          {!isOwn && me && (
            <ProfileActions
              userId={userId}
              currentUserId={me.id}
              liked={liked}
              liking={liking}
              onLike={handleLike}
              onMessage={handleMessage}
              onShare={handleShare}
              onBlock={handleBlock}
              msgFlash={msgFlash}
              shared={shared}
              blocked={blocked}
            />
          )}
        </div>

        {/* فاصل */}
        <div style={{ height: 1, background: 'var(--glass-border)', margin: '0 16px 16px' }} />

        {/* ── المحتوى ──────────────────────────────────────────── */}
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
            <Row icon={<Briefcase size={13}/>}     label="المهنة"           value={jobLabel} />
            <Row icon={<GraduationCap size={13}/>} label="المستوى الدراسي"  value={eduLabel} />
            <Row icon={<Flame size={13}/>}          label="الوضع المادي"     value={profile.financial_status} />
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

      {/* ChatWindow */}
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