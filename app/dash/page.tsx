'use client';
/**
 * app/dash/page.tsx — لوحة تحكم الوسيط
 * يشمل: ملف الوسيط · تقدم المستوى · إحصائيات · تواصل اجتماعي · تسعير · تقييمات
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter }           from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Star, Crown, ChevronLeft, ChevronRight,
  Save, Plus, X, TrendingUp, Edit3, Check,
} from 'lucide-react';
import { supabase }            from '@/lib/supabase/client';
import { LoveCoin }            from '@/components/ui/LoveCoin';
import { LevelBadge }          from '@/components/gems';
import { Stars }               from '@/components/mediators/Stars';
import { Icon }                from '@/components/mediators/Icon';
import { calculateUserProgress } from '@/lib/gems/LevelConfig';
import { toast }               from 'sonner';

/* ── Social SVG Icons ─────────────────────────────────── */
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ display:'block', fill:'currentColor', flexShrink:0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ display:'block', fill:'currentColor', flexShrink:0 }}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.27 8.27 0 004.84 1.55V6.84a4.85 4.85 0 01-1.07-.15z"/>
    </svg>
  );
}

/* ── Types ────────────────────────────────────────────── */
interface MedProfile {
  full_name: string; avatar_url: string | null;
  mediator_level: string; created_at: string;
  whatsapp: string | null; tiktok: string | null;
}
interface MedWallet {
  total_coins: number; total_tnd: number;
  pending_tnd: number; total_subscription_events: number;
}
interface MedPricing {
  tier_1_coins: number; tier_1_label: string; tier_1_desc: string; tier_1_perks: string[];
  tier_2_coins: number; tier_2_label: string; tier_2_desc: string; tier_2_perks: string[];
  popular_tier: 1 | 2;
}
interface Review {
  id: string; rating: number; comment: string | null;
  created_at: string; reviewer_name: string | null; reviewer_avatar: string | null;
}

/* ── Helper Components ────────────────────────────────── */
function Spin({ size = 18 }: { size?: number }) {
  return (
    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      style={{ display:'inline-block', width:size, height:size,
        border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'var(--color-primary)', borderRadius:'50%' }} />
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="font-black" style={{ fontSize:'var(--text-sm)', color:'var(--text-main)' }}>{children}</p>
      {action}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: React.ReactNode; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] p-4"
      style={{ background:'var(--glass-bg)', border:`1px solid ${color}28`, boxShadow:'var(--shadow-soft)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color, lineHeight:1 }}>{icon}</span>
        <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:600 }}>{label}</p>
      </div>
      <p className="font-black" style={{ fontSize:'var(--text-xl)', color, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', marginTop:4 }}>{sub}</p>}
    </div>
  );
}

function PerksList({ perks, onChange }: { perks: string[]; onChange: (p: string[]) => void }) {
  const add    = ()           => { if (perks.length < 5) onChange([...perks, '']); };
  const remove = (i: number) => onChange(perks.filter((_, j) => j !== i));
  const update = (i: number, v: string) => onChange(perks.map((p, j) => j === i ? v : p));
  return (
    <div className="space-y-2">
      {perks.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={p} onChange={e => update(i, e.target.value)}
            placeholder={`ميزة ${i + 1}...`}
            style={{ flex:1, padding:'8px 12px', borderRadius:12, outline:'none',
              background:'var(--bg-soft)', border:'1px solid var(--glass-border)',
              color:'var(--text-main)', fontSize:'var(--text-xs)', fontFamily:'inherit' }} />
          {perks.length > 1 && (
            <button onClick={() => remove(i)}
              className="w-7 h-7 rounded-full flex items-center justify-center icon-wrap shrink-0"
              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <Icon i={X} size={11} color="#f87171" />
            </button>
          )}
        </div>
      ))}
      {perks.length < 5 && (
        <button onClick={add} className="flex items-center gap-1.5 icon-wrap"
          style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)' }}>
          <Icon i={Plus} size={12} color="var(--text-tertiary)" /> إضافة ميزة
        </button>
      )}
    </div>
  );
}

/* ── Coins Stepper (خطوة 500، بدون نص حدود) ─────────── */
function CoinsStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3 justify-center py-2">
      <button onClick={() => onChange(Math.max(1000, value - 500))}
        disabled={value <= 1000}
        className="w-10 h-10 rounded-full flex items-center justify-center font-black"
        style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
          color: value <= 1000 ? 'var(--text-tertiary)' : 'var(--text-main)', fontSize:20 }}>
        −
      </button>
      <span className="font-black" style={{ fontSize:'var(--text-xl)', color:'var(--text-main)',
        minWidth:90, textAlign:'center', fontVariantNumeric:'tabular-nums' }}>
        {value.toLocaleString('ar-TN')}
      </span>
      <button onClick={() => onChange(Math.min(10000, value + 500))}
        disabled={value >= 10000}
        className="w-10 h-10 rounded-full flex items-center justify-center font-black"
        style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
          color: value >= 10000 ? 'var(--text-tertiary)' : 'var(--text-main)', fontSize:20 }}>
        +
      </button>
      <LoveCoin size={20} />
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────── */
export default function DashPage() {
  const router = useRouter();

  const [loading,   setLoading]   = useState(true);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [profile,   setProfile]   = useState<MedProfile | null>(null);
  const [wallet,    setWallet]    = useState<MedWallet | null>(null);
  const [pricing,   setPricing]   = useState<MedPricing | null>(null);
  const [reviews,   setReviews]   = useState<Review[]>([]);
  const [male,      setMale]      = useState(0);
  const [female,    setFemale]    = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  // social edit
  const [editSocial,  setEditSocial]  = useState(false);
  const [wa,          setWa]          = useState('');
  const [tt,          setTt]          = useState('');
  const [savingSocial, setSavingSocial] = useState(false);

  // pricing edit
  const [editPricing,  setEditPricing]  = useState(false);
  const [pForm,        setPForm]        = useState<MedPricing | null>(null);
  const [savingPricing, setSavingPricing] = useState(false);

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    setUserId(user.id);

    const { data: prof } = await supabase.from('profiles')
      .select('full_name,avatar_url,mediator_level,created_at,role,whatsapp,tiktok')
      .eq('id', user.id).single();

    if (prof?.role !== 'mediator') { router.replace('/home'); return; }
    setProfile(prof as MedProfile);
    setWa(prof.whatsapp ?? '');
    setTt(prof.tiktok ?? '');

    const [walletRes, pricingRes, reviewsRes, subsRes] = await Promise.all([
      supabase.from('mediator_wallets')
        .select('total_coins,total_tnd,pending_tnd,total_subscription_events')
        .eq('mediator_id', user.id).single(),
      supabase.from('mediator_pricing')
        .select('*').eq('mediator_id', user.id).maybeSingle(),
      supabase.from('mediator_reviews')
        .select('review_internal_id,rating,comment,created_at,id')
        .eq('mediator_id', user.id)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('mediator_subscriptions')
        .select('id')
        .eq('mediator_id', user.id).eq('status','active')
        .gt('expires_at', new Date().toISOString()),
    ]);

    setWallet(walletRes.data as MedWallet);

    if (pricingRes.data) {
      const p = pricingRes.data as MedPricing;
      setPricing(p);
      setPForm({ ...p, tier_1_perks:[...p.tier_1_perks], tier_2_perks:[...p.tier_2_perks] });
    }

    // عدد الذكور والإناث
    const subIds = (subsRes.data ?? []).map((s: any) => s.id);
    if (subIds.length > 0) {
      const { data: genders } = await supabase.from('profiles')
        .select('gender').in('id', subIds);
      setMale(genders?.filter((p: any) => p.gender === 'male').length   ?? 0);
      setFemale(genders?.filter((p: any) => p.gender === 'female').length ?? 0);
    } else { setMale(0); setFemale(0); }

    // التقييمات مع أسماء المقيّمين
    const rawReviews = reviewsRes.data ?? [];
    const reviewerIds = [...new Set(rawReviews.map((r: any) => r.id).filter(Boolean))];
    let rMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (reviewerIds.length > 0) {
      const { data: rp } = await supabase.from('profiles')
        .select('id,full_name,avatar_url').in('id', reviewerIds);
      rMap = Object.fromEntries((rp ?? []).map((p: any) => [p.id, p]));
    }
    const rev: Review[] = rawReviews.map((r: any) => ({
      id: r.review_internal_id, rating: r.rating,
      comment: r.comment, created_at: r.created_at,
      reviewer_name:   rMap[r.id]?.full_name  ?? null,
      reviewer_avatar: rMap[r.id]?.avatar_url ?? null,
    }));
    setReviews(rev);
    setAvgRating(rev.length > 0 ? rev.reduce((s, r) => s + r.rating, 0) / rev.length : 0);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  /* ── Social Save ── */
  const saveSocial = async () => {
    if (!userId) return;
    setSavingSocial(true);
    const { error } = await supabase.from('profiles')
      .update({ whatsapp: wa.trim() || null, tiktok: tt.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', userId);
    setSavingSocial(false);
    if (error) { toast.error('فشل الحفظ'); return; }
    setProfile(p => p ? { ...p, whatsapp: wa.trim() || null, tiktok: tt.trim() || null } : p);
    setEditSocial(false);
    toast.success('تم حفظ بيانات التواصل');
  };

  /* ── Pricing Save ── */
  const savePricing = async () => {
    if (!userId || !pForm) return;
    if (pForm.tier_1_coins < 1000 || pForm.tier_1_coins > 10000 ||
        pForm.tier_2_coins < 1000 || pForm.tier_2_coins > 10000) {
      toast.error('قيمة العملات يجب أن تكون بين 1,000 و 10,000'); return;
    }
    if (!pForm.tier_1_label.trim() || !pForm.tier_2_label.trim()) {
      toast.error('اسم الباقة لا يمكن أن يكون فارغاً'); return;
    }
    setSavingPricing(true);
    const { error } = await supabase.from('mediator_pricing').upsert({
      mediator_id:   userId,
      ...pForm,
      tier_1_perks:  pForm.tier_1_perks.filter(Boolean),
      tier_2_perks:  pForm.tier_2_perks.filter(Boolean),
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'mediator_id' });
    setSavingPricing(false);
    if (error) { console.error('[pricing save]', error); toast.error('فشل الحفظ: ' + error.message); return; }
    setPricing({ ...pForm });
    setEditPricing(false);
    toast.success('تم حفظ العروض بنجاح');
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background:'var(--bg-main)' }}>
      <motion.div animate={{ scale:[1,1.15,1] }} transition={{ repeat:Infinity, duration:1.2 }}>
        <Icon i={Crown} size={48} color="var(--color-primary)" />
      </motion.div>
    </div>
  );

  const total     = wallet?.total_subscription_events ?? 0;
  const progress  = calculateUserProgress(total);
  const joinDate  = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ar-TN', { year:'numeric', month:'long' })
    : '';

  return (
    <div dir="rtl" className="min-h-full pb-8"
      style={{ background:'var(--bg-main)', paddingBottom:'var(--nav-h-safe)' }}>

      {/* ══ HEADER ══════════════════════════════════════ */}
      <div className="px-4 pt-6 pb-4">
        <div className="rounded-[28px] p-5"
          style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
            boxShadow:'var(--shadow-soft)', position:'relative', overflow:'hidden' }}>

          {/* shimmer */}
          <motion.span aria-hidden
            animate={{ x:['-120%','220%'] }}
            transition={{ repeat:Infinity, duration:4, ease:'easeInOut', repeatDelay:3 }}
            style={{ position:'absolute', top:0, left:0, width:'35%', height:'100%',
              background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.06),transparent)',
              pointerEvents:'none' }} />

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden"
                style={{ border:'2.5px solid var(--border-gold)' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center icon-wrap"
                      style={{ background:'var(--bg-soft)' }}>
                      <Icon i={Crown} size={30} color="var(--text-tertiary)" />
                    </div>}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-black truncate"
                  style={{ fontSize:'var(--text-lg)', color:'var(--text-main)' }}>
                  {profile?.full_name}
                </h1>
                <LevelBadge subscribers={total} size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <Stars value={avgRating} size={11} />
                <span className="font-bold" style={{ fontSize:'var(--text-xs)', color:'#D4AF37' }}>
                  {avgRating.toFixed(1)}
                </span>
              </div>
              <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', marginTop:4 }}>
                عضو منذ {joinDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ══ LEVEL PROGRESS ══════════════════════════════ */}
        <div className="rounded-[24px] p-4"
          style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>

          {/* عنوان + عداد */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 icon-wrap">
              <Icon i={TrendingUp} size={14} color="#D4AF37" />
              <span className="font-black" style={{ fontSize:'var(--text-xs)', color:'var(--text-main)' }}>
                تقدم المستوى
              </span>
            </div>
            <span style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)' }}>
              {total.toLocaleString('ar-TN')} اشتراك كلي
            </span>
          </div>

          {/* المستوى الحالي والتالي */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LevelBadge subscribers={total} size="sm" />
              <span className="font-black" style={{ fontSize:'var(--text-xs)', color:'var(--text-main)', direction:'ltr' }}>
                {progress.currentLevel.label}
              </span>
            </div>
            {progress.nextLevel ? (
              <div className="flex items-center gap-2"
                style={{ opacity:0.45 }}>
                <span style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', direction:'ltr' }}>
                  {progress.nextLevel.label}
                </span>
                <LevelBadge subscribers={progress.nextLevel.minSubscribers} size="sm" />
              </div>
            ) : (
              <span className="font-black" style={{ fontSize:'var(--text-2xs)', color:'#D4AF37' }}>
                الحد الأقصى ✦
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="relative h-2.5 rounded-full overflow-hidden mb-3"
            style={{ background:'var(--bg-soft)' }}>
            <motion.div
              initial={{ width:0 }}
              animate={{ width:`${Math.min(progress.progressPercentage, 100)}%` }}
              transition={{ duration:1.4, ease:'easeOut', delay:0.2 }}
              className="absolute inset-y-0 right-0 rounded-full"
              style={{ background:'linear-gradient(to left,var(--color-primary),#D4AF37)',
                boxShadow:'0 0 8px rgba(212,175,55,0.4)' }} />
          </div>

          {/* إحصاء التقدم */}
          <div className="flex items-center justify-between">
            <span style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontVariantNumeric:'tabular-nums' }}>
              {progress.progressPercentage.toFixed(1)}٪ مكتمل
            </span>
            {progress.nextLevel && (
              <span style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)' }}>
                {progress.subscribersNeeded} اشتراك للمستوى التالي
              </span>
            )}
          </div>
        </div>

        {/* ══ STATS ════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="ذكور نشطون" color="#60A5FA" sub="مشترك حالياً"
            icon={<span style={{ fontSize:14 }}>♂</span>} value={male} />
          <StatCard label="إناث نشطات" color="#F472B6" sub="مشتركة حالياً"
            icon={<span style={{ fontSize:14 }}>♀</span>} value={female} />
          <StatCard label="إجمالي الاشتراكات" color="#D4AF37" sub="منذ البداية"
            icon={<Icon i={Crown} size={13} color="#D4AF37" />} value={total} />
          <StatCard label="متوسط التقييم" color="#22c55e" sub={`${reviews.length} تقييم`}
            icon={<Icon i={Star} size={13} color="#22c55e" />}
            value={<span className="flex items-center gap-1">{avgRating.toFixed(1)} <span style={{ fontSize:'var(--text-sm)' }}>★</span></span>} />
        </div>

        {/* ══ رابط إدارة المشتركين ════════════════════════ */}
        <motion.button whileTap={{ scale:0.97 }}
          onClick={() => router.push('/subscribers')}
          className="w-full rounded-[22px] p-4 flex items-center justify-between icon-wrap"
          style={{ background:'rgba(179,51,75,0.08)', border:'1px solid var(--border-soft)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center icon-wrap"
              style={{ background:'var(--color-primary-soft)' }}>
              <Icon i={Users} size={18} color="var(--color-primary)" />
            </div>
            <div className="text-right">
              <p className="font-black" style={{ fontSize:'var(--text-sm)', color:'var(--text-main)' }}>
                إدارة المشتركين
              </p>
              <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)' }}>
                بحث · فلاتر · رسائل
              </p>
            </div>
          </div>
          <Icon i={ChevronLeft} size={16} color="var(--text-tertiary)" />
        </motion.button>

        {/* ══ SOCIAL LINKS ═════════════════════════════════ */}
        <div className="rounded-[24px] p-4"
          style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
          <SectionTitle
            action={
              <button onClick={() => setEditSocial(v => !v)}
                className="flex items-center gap-1.5 icon-wrap px-3 py-1.5 rounded-full"
                style={{ background: editSocial ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
                  border: editSocial ? '1px solid var(--border-soft)' : '1px solid var(--glass-border)',
                  fontSize:'var(--text-2xs)', color: editSocial ? 'var(--color-primary)' : 'var(--text-tertiary)' }}>
                <Icon i={Edit3} size={11} color={editSocial ? 'var(--color-primary)' : 'var(--text-tertiary)'} />
                {editSocial ? 'إلغاء' : 'تعديل'}
              </button>
            }>
            بيانات التواصل
          </SectionTitle>

          <AnimatePresence mode="wait">
            {!editSocial ? (
              <motion.div key="view" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="space-y-3">
                <div className="flex items-center gap-3">
                  <span style={{ color:'#25D166', width:20, display:'flex', justifyContent:'center' }}>
                    <WhatsAppIcon size={18} />
                  </span>
                  <span style={{ fontSize:'var(--text-sm)', color: profile?.whatsapp ? 'var(--text-main)' : 'var(--text-tertiary)', direction:'ltr' }}>
                    {profile?.whatsapp ?? 'غير محدد'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color:'var(--text-secondary)', width:20, display:'flex', justifyContent:'center' }}>
                    <TikTokIcon size={18} />
                  </span>
                  <span style={{ fontSize:'var(--text-sm)', color: profile?.tiktok ? 'var(--text-main)' : 'var(--text-tertiary)', direction:'ltr' }}>
                    {profile?.tiktok ? `@${profile.tiktok.replace('@','')}` : 'غير محدد'}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div key="edit" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="space-y-3">
                {/* WhatsApp */}
                <div>
                  <label style={{ fontSize:'var(--text-2xs)', color:'#25D166', fontWeight:700, display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                    <WhatsAppIcon size={13} /> رقم واتساب (مع كود الدولة)
                  </label>
                  <input value={wa} onChange={e => setWa(e.target.value)}
                    placeholder="+21612345678" dir="ltr"
                    style={{ width:'100%', padding:'10px 14px', borderRadius:14, outline:'none',
                      background:'var(--bg-soft)', border:'1px solid var(--glass-border)',
                      color:'var(--text-main)', fontSize:'var(--text-sm)', fontFamily:'inherit' }} />
                </div>
                {/* TikTok */}
                <div>
                  <label style={{ fontSize:'var(--text-2xs)', color:'var(--text-secondary)', fontWeight:700, display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                    <TikTokIcon size={13} /> اسم مستخدم تيك توك
                  </label>
                  <input value={tt} onChange={e => setTt(e.target.value)}
                    placeholder="@username" dir="ltr"
                    style={{ width:'100%', padding:'10px 14px', borderRadius:14, outline:'none',
                      background:'var(--bg-soft)', border:'1px solid var(--glass-border)',
                      color:'var(--text-main)', fontSize:'var(--text-sm)', fontFamily:'inherit' }} />
                </div>
                <motion.button whileTap={{ scale:0.97 }} onClick={saveSocial} disabled={savingSocial}
                  className="w-full py-3 rounded-2xl font-black flex items-center justify-center gap-2 icon-wrap"
                  style={{ background:'linear-gradient(135deg,#800020,var(--color-primary))',
                    boxShadow:'0 6px 20px var(--shadow-red-glow)', color:'#fff',
                    fontSize:'var(--text-sm)', opacity: savingSocial ? 0.7 : 1 }}>
                  {savingSocial ? <Spin /> : <><Icon i={Save} size={14} color="#fff" /> حفظ التواصل</>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ PRICING EDITOR ═══════════════════════════════ */}
        <div className="rounded-[24px] p-4"
          style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
          <SectionTitle
            action={
              <button onClick={() => setEditPricing(v => !v)}
                className="flex items-center gap-1.5 icon-wrap px-3 py-1.5 rounded-full"
                style={{ background: editPricing ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
                  border: editPricing ? '1px solid var(--border-soft)' : '1px solid var(--glass-border)',
                  fontSize:'var(--text-2xs)', color: editPricing ? 'var(--color-primary)' : 'var(--text-tertiary)' }}>
                <Icon i={Edit3} size={11} color={editPricing ? 'var(--color-primary)' : 'var(--text-tertiary)'} />
                {editPricing ? 'إلغاء' : 'تعديل'}
              </button>
            }>
            عروض الاشتراك
          </SectionTitle>

          <AnimatePresence mode="wait">
            {!editPricing ? (
              /* عرض الأسعار */
              <motion.div key="view" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="space-y-3">
                {pricing && [
                  { label:pricing.tier_1_label, coins:pricing.tier_1_coins, perks:pricing.tier_1_perks },
                  { label:pricing.tier_2_label, coins:pricing.tier_2_coins, perks:pricing.tier_2_perks },
                ].map((t, i) => (
                  <div key={i} className="rounded-[20px] p-4"
                    style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black" style={{ fontSize:'var(--text-sm)', color:'var(--text-main)' }}>{t.label}</span>
                      <span className="flex items-center gap-1.5 font-black"
                        style={{ fontSize:'var(--text-base)', color:'var(--text-main)' }}>
                        {t.coins.toLocaleString('ar-TN')} <LoveCoin size={15} />
                      </span>
                    </div>
                    <div className="space-y-1">
                      {(t.perks ?? []).map((p: string, j: number) => (
                        <div key={j} className="flex items-center gap-2 icon-wrap">
                          <Icon i={Check} size={11} color="#22c55e" strokeWidth={2.5} />
                          <span style={{ fontSize:'var(--text-2xs)', color:'var(--text-secondary)' }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              /* تعديل الأسعار */
              <motion.div key="edit" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="space-y-5">
                {pForm && ([1,2] as (1|2)[]).map(n => {
                  const pre   = `tier_${n}` as 'tier_1' | 'tier_2';
                  const coins = pForm[`${pre}_coins`];
                  const label = pForm[`${pre}_label`];
                  const desc  = pForm[`${pre}_desc`];
                  const perks = pForm[`${pre}_perks`];
                  const color = n === 2 ? '#D4AF37' : 'var(--color-primary)';
                  const border = n === 2 ? '1px solid rgba(212,175,55,0.3)' : '1px solid var(--border-soft)';

                  return (
                    <div key={n} className="rounded-[20px] p-4 space-y-3"
                      style={{ background: n === 2 ? 'rgba(212,175,55,0.06)' : 'rgba(179,51,75,0.06)', border }}>
                      <p className="font-black" style={{ fontSize:'var(--text-xs)', color }}>
                        الباقة {n === 1 ? 'الأولى' : 'الثانية'}
                      </p>

                      {/* اسم الباقة */}
                      <input value={label}
                        onChange={e => setPForm(f => f ? { ...f, [`${pre}_label`]: e.target.value } : f)}
                        placeholder="اسم الباقة"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:12, outline:'none',
                          background:'var(--bg-soft)', border:'1px solid var(--glass-border)',
                          color:'var(--text-main)', fontSize:'var(--text-xs)', fontFamily:'inherit' }} />

                      {/* الوصف */}
                      <textarea value={desc} rows={2}
                        onChange={e => setPForm(f => f ? { ...f, [`${pre}_desc`]: e.target.value } : f)}
                        placeholder="وصف قصير للباقة..."
                        style={{ width:'100%', padding:'8px 12px', borderRadius:12, outline:'none', resize:'none',
                          background:'var(--bg-soft)', border:'1px solid var(--glass-border)',
                          color:'var(--text-main)', fontSize:'var(--text-xs)', fontFamily:'inherit' }} />

                      {/* عدد العملات */}
                      <div>
                        <label style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:600, display:'block', marginBottom:8 }}>
                          قيمة الاشتراك
                        </label>
                        <CoinsStepper value={coins}
                          onChange={v => setPForm(f => f ? { ...f, [`${pre}_coins`]: v } : f)} />
                      </div>

                      {/* المميزات */}
                      <div>
                        <label style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:600, display:'block', marginBottom:8 }}>
                          مميزات الباقة (حتى 5)
                        </label>
                        <PerksList perks={perks}
                          onChange={p => setPForm(f => f ? { ...f, [`${pre}_perks`]: p } : f)} />
                      </div>
                    </div>
                  );
                })}

                {/* الباقة الأشهر */}
                {pForm && (
                  <div>
                    <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:600, marginBottom:8 }}>
                      أي الباقتين «الأشهر»؟
                    </p>
                    <div className="flex gap-2">
                      {([1,2] as (1|2)[]).map(n => (
                        <button key={n} onClick={() => setPForm(f => f ? { ...f, popular_tier: n } : f)}
                          className="flex-1 py-2.5 rounded-2xl font-black"
                          style={{
                            fontSize:'var(--text-xs)',
                            background: pForm.popular_tier === n ? 'rgba(212,175,55,0.12)' : 'var(--glass-bg)',
                            border: pForm.popular_tier === n ? '1px solid var(--border-gold)' : '1px solid var(--glass-border)',
                            color: pForm.popular_tier === n ? '#D4AF37' : 'var(--text-tertiary)',
                          }}>
                          الباقة {n === 1 ? 'الأولى' : 'الثانية'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <motion.button whileTap={{ scale:0.97 }} onClick={savePricing} disabled={savingPricing}
                  className="w-full py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 icon-wrap"
                  style={{ background:'linear-gradient(135deg,#800020,var(--color-primary))',
                    boxShadow:'0 6px 20px var(--shadow-red-glow)', color:'#fff',
                    fontSize:'var(--text-sm)', opacity: savingPricing ? 0.7 : 1 }}>
                  {savingPricing ? <Spin /> : <><Icon i={Save} size={14} color="#fff" /> حفظ العروض</>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ REVIEWS ══════════════════════════════════════ */}
        <div className="rounded-[24px] p-4"
          style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
          <SectionTitle>
            <span className="flex items-center gap-2 icon-wrap">
              <Icon i={Star} size={13} color="#D4AF37" />
              التقييمات
              {reviews.length > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold"
                  style={{ fontSize:'var(--text-2xs)', background:'rgba(212,175,55,0.12)', color:'#D4AF37' }}>
                  {reviews.length}
                </span>
              )}
            </span>
          </SectionTitle>

          {reviews.length === 0 ? (
            <div className="text-center py-8 icon-wrap">
              <Icon i={Star} size={32} color="var(--text-tertiary)" className="mx-auto mb-2" />
              <p style={{ fontSize:'var(--text-sm)', color:'var(--text-tertiary)' }}>لا توجد تقييمات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <motion.div key={r.id}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-[18px] p-4"
                  style={{ background:'var(--bg-soft)', border:'1px solid var(--glass-border)' }}>
                  <div className="flex items-start gap-3">
                    {/* avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0"
                      style={{ border:'1px solid var(--glass-border)' }}>
                      {r.reviewer_avatar
                        ? <img src={r.reviewer_avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center icon-wrap"
                            style={{ background:'var(--bg-elevated)' }}>
                            <Icon i={Crown} size={16} color="var(--text-tertiary)" />
                          </div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-black truncate"
                          style={{ fontSize:'var(--text-sm)', color:'var(--text-main)' }}>
                          {r.reviewer_name ?? 'مستخدم'}
                        </p>
                        <span style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', whiteSpace:'nowrap', marginRight:8 }}>
                          {new Date(r.created_at).toLocaleDateString('ar-TN',
                            { day:'numeric', month:'short', year:'numeric' })}
                        </span>
                      </div>
                      <Stars value={r.rating} size={12} />
                      {r.comment && (
                        <p style={{ fontSize:'var(--text-xs)', color:'var(--text-secondary)',
                          marginTop:6, lineHeight:'var(--lh-relaxed)' }}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}