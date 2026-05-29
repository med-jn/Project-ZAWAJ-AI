'use client';
/**
 * app/dash/page.tsx — لوحة تحكم الوسيط (التطبيق)
 * ✅ حُذف قسم التسعير → نُقل للموقع (mediator-pricing/page.tsx)
 * ✅ MediatorLevelProgress → مكوّن مستقل
 * ✅ حُذف LoveCoin و CoinsStepper و PerksList تماماً
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter }                         from 'next/navigation';
import { motion, AnimatePresence }           from 'framer-motion';
import { Users, Star, Crown, ChevronLeft, Save, Edit3 } from 'lucide-react';
import { supabase }                          from '@/lib/supabase/client';
import { LevelBadge }                        from '@/components/gems';
import { Stars }                             from '@/components/mediators/Stars';
import { Icon }                              from '@/components/mediators/Icon';
import { MediatorLevelProgress }             from '@/components/mediators/MediatorLevelProgress';
import { toast }                             from 'sonner';

/* ── Social SVG Icons ─────────────────────────────────── */
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ display: 'block', fill: 'currentColor', flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ display: 'block', fill: 'currentColor', flexShrink: 0 }}>
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
interface Review {
  id: string; rating: number; comment: string | null;
  created_at: string; reviewer_name: string | null; reviewer_avatar: string | null;
}

/* ── Helpers ──────────────────────────────────────────── */
function Spin({ size = 18 }: { size?: number }) {
  return (
    <motion.span animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      style={{ display: 'inline-block', width: size, height: size,
        border: '2px solid rgba(255,255,255,0.2)',
        borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="font-black" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
        {children}
      </p>
      {action}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: React.ReactNode; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] p-4"
      style={{ background: 'var(--glass-bg)', border: `1px solid ${color}28`, boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color, lineHeight: 1 }}>{icon}</span>
        <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>{label}</p>
      </div>
      <p className="font-black" style={{ fontSize: 'var(--text-xl)', color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function DashPage() {
  const router = useRouter();

  const [loading,      setLoading]      = useState(true);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [profile,      setProfile]      = useState<MedProfile | null>(null);
  const [wallet,       setWallet]       = useState<MedWallet | null>(null);
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [male,         setMale]         = useState(0);
  const [female,       setFemale]       = useState(0);
  const [avgRating,    setAvgRating]    = useState(0);
  const [editSocial,   setEditSocial]   = useState(false);
  const [wa,           setWa]           = useState('');
  const [tt,           setTt]           = useState('');
  const [savingSocial, setSavingSocial] = useState(false);

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

    const [walletRes, reviewsRes, subsRes] = await Promise.all([
      supabase.from('mediator_wallets')
        .select('total_coins,total_tnd,pending_tnd,total_subscription_events')
        .eq('mediator_id', user.id).single(),
      supabase.from('mediator_reviews')
        .select('review_internal_id,rating,comment,created_at,id')
        .eq('mediator_id', user.id)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('mediator_subscriptions')
        .select('id')
        .eq('mediator_id', user.id).eq('status', 'active')
        .gt('expires_at', new Date().toISOString()),
    ]);

    setWallet(walletRes.data as MedWallet);

    // ذكور / إناث
    const subIds = (subsRes.data ?? []).map((s: any) => s.id);
    if (subIds.length > 0) {
      const { data: genders } = await supabase.from('profiles')
        .select('gender').in('id', subIds);
      setMale(genders?.filter((p: any) => p.gender === 'male').length ?? 0);
      setFemale(genders?.filter((p: any) => p.gender === 'female').length ?? 0);
    } else { setMale(0); setFemale(0); }

    // تقييمات
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

  /* ── Loading ── */
  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
        <Icon i={Crown} size={48} color="var(--color-primary)" />
      </motion.div>
    </div>
  );

  const total    = wallet?.total_subscription_events ?? 0;
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ar-TN', { year: 'numeric', month: 'long' })
    : '';

  return (
    <div dir="rtl" className="min-h-full pb-8"
      style={{ background: 'var(--bg-main)', paddingBottom: 'var(--nav-h-safe)' }}>

      {/* ══ HEADER ══════════════════════════════════════ */}
      <div className="px-4 pt-6 pb-4">
        <div className="rounded-[28px] p-5"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-soft)', position: 'relative', overflow: 'hidden' }}>

          <motion.span aria-hidden
            animate={{ x: ['-120%', '220%'] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', repeatDelay: 3 }}
            style={{ position: 'absolute', top: 0, left: 0, width: '35%', height: '100%',
              background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.06),transparent)',
              pointerEvents: 'none' }} />

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden"
                style={{ border: '2.5px solid var(--border-gold)' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center icon-wrap"
                      style={{ background: 'var(--bg-soft)' }}>
                      <Icon i={Crown} size={30} color="var(--text-tertiary)" />
                    </div>}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-black truncate"
                  style={{ fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}>
                  {profile?.full_name}
                </h1>
                <LevelBadge subscribers={total} size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <Stars value={avgRating} size={11} />
                <span className="font-bold" style={{ fontSize: 'var(--text-xs)', color: '#D4AF37' }}>
                  {avgRating.toFixed(1)}
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                عضو منذ {joinDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ══ LEVEL PROGRESS — مكوّن مستقل ═══════════════ */}
        <MediatorLevelProgress total={total} />

        {/* ══ STATS ════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="ذكور نشطون" color="#60A5FA" sub="مشترك حالياً"
            icon={<span style={{ fontSize: 14 }}>♂</span>} value={male} />
          <StatCard label="إناث نشطات" color="#F472B6" sub="مشتركة حالياً"
            icon={<span style={{ fontSize: 14 }}>♀</span>} value={female} />
          <StatCard label="إجمالي الاشتراكات" color="#D4AF37" sub="منذ البداية"
            icon={<Icon i={Crown} size={13} color="#D4AF37" />} value={total} />
          <StatCard label="متوسط التقييم" color="#22c55e" sub={`${reviews.length} تقييم`}
            icon={<Icon i={Star} size={13} color="#22c55e" />}
            value={<span className="flex items-center gap-1">
              {avgRating.toFixed(1)} <span style={{ fontSize: 'var(--text-sm)' }}>★</span>
            </span>} />
        </div>

        {/* ══ إدارة المشتركين ══════════════════════════════ */}
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/subscribers')}
          className="w-full rounded-[22px] p-4 flex items-center justify-between icon-wrap"
          style={{ background: 'rgba(179,51,75,0.08)', border: '1px solid var(--border-soft)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center icon-wrap"
              style={{ background: 'var(--color-primary-soft)' }}>
              <Icon i={Users} size={18} color="var(--color-primary)" />
            </div>
            <div className="text-right">
              <p className="font-black" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                إدارة المشتركين
              </p>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                بحث · فلاتر · رسائل
              </p>
            </div>
          </div>
          <Icon i={ChevronLeft} size={16} color="var(--text-tertiary)" />
        </motion.button>

        {/* ══ SOCIAL LINKS ═════════════════════════════════ */}
        <div className="rounded-[24px] p-4"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          <SectionTitle
            action={
              <button onClick={() => setEditSocial(v => !v)}
                className="flex items-center gap-1.5 icon-wrap px-3 py-1.5 rounded-full"
                style={{
                  background: editSocial ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
                  border: editSocial ? '1px solid var(--border-soft)' : '1px solid var(--glass-border)',
                  fontSize: 'var(--text-2xs)',
                  color: editSocial ? 'var(--color-primary)' : 'var(--text-tertiary)',
                }}>
                <Icon i={Edit3} size={11} color={editSocial ? 'var(--color-primary)' : 'var(--text-tertiary)'} />
                {editSocial ? 'إلغاء' : 'تعديل'}
              </button>
            }>
            بيانات التواصل
          </SectionTitle>

          <AnimatePresence mode="wait">
            {!editSocial ? (
              <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-3">
                <div className="flex items-center gap-3">
                  <span style={{ color: '#25D166', width: 20, display: 'flex', justifyContent: 'center' }}>
                    <WhatsAppIcon size={18} />
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', direction: 'ltr',
                    color: profile?.whatsapp ? 'var(--text-main)' : 'var(--text-tertiary)' }}>
                    {profile?.whatsapp ?? 'غير محدد'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: 'var(--text-secondary)', width: 20, display: 'flex', justifyContent: 'center' }}>
                    <TikTokIcon size={18} />
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', direction: 'ltr',
                    color: profile?.tiktok ? 'var(--text-main)' : 'var(--text-tertiary)' }}>
                    {profile?.tiktok ? `@${profile.tiktok.replace('@', '')}` : 'غير محدد'}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div key="edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="space-y-3">
                <div>
                  <label style={{ fontSize: 'var(--text-2xs)', color: '#25D166', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <WhatsAppIcon size={13} /> رقم واتساب (مع كود الدولة)
                  </label>
                  <input value={wa} onChange={e => setWa(e.target.value)}
                    placeholder="+21612345678" dir="ltr"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 14, outline: 'none',
                      background: 'var(--bg-soft)', border: '1px solid var(--glass-border)',
                      color: 'var(--text-main)', fontSize: 'var(--text-sm)', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <TikTokIcon size={13} /> اسم مستخدم تيك توك
                  </label>
                  <input value={tt} onChange={e => setTt(e.target.value)}
                    placeholder="@username" dir="ltr"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 14, outline: 'none',
                      background: 'var(--bg-soft)', border: '1px solid var(--glass-border)',
                      color: 'var(--text-main)', fontSize: 'var(--text-sm)', fontFamily: 'inherit' }} />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={saveSocial} disabled={savingSocial}
                  className="w-full py-3 rounded-2xl font-black flex items-center justify-center gap-2 icon-wrap"
                  style={{ background: 'linear-gradient(135deg,#800020,var(--color-primary))',
                    boxShadow: '0 6px 20px var(--shadow-red-glow)', color: '#fff',
                    fontSize: 'var(--text-sm)', opacity: savingSocial ? 0.7 : 1 }}>
                  {savingSocial ? <Spin /> : <><Icon i={Save} size={14} color="#fff" /> حفظ التواصل</>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ REVIEWS ══════════════════════════════════════ */}
        <div className="rounded-[24px] p-4"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          <SectionTitle>
            <span className="flex items-center gap-2 icon-wrap">
              <Icon i={Star} size={13} color="#D4AF37" />
              التقييمات
              {reviews.length > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold"
                  style={{ fontSize: 'var(--text-2xs)', background: 'rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  {reviews.length}
                </span>
              )}
            </span>
          </SectionTitle>

          {reviews.length === 0 ? (
            <div className="text-center py-8 icon-wrap">
              <Icon i={Star} size={32} color="var(--text-tertiary)" className="mx-auto mb-2" />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>لا توجد تقييمات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <motion.div key={r.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-[18px] p-4"
                  style={{ background: 'var(--bg-soft)', border: '1px solid var(--glass-border)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0"
                      style={{ border: '1px solid var(--glass-border)' }}>
                      {r.reviewer_avatar
                        ? <img src={r.reviewer_avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center icon-wrap"
                            style={{ background: 'var(--bg-elevated)' }}>
                            <Icon i={Crown} size={16} color="var(--text-tertiary)" />
                          </div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-black truncate"
                          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                          {r.reviewer_name ?? 'مستخدم'}
                        </p>
                        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)',
                          whiteSpace: 'nowrap', marginRight: 8 }}>
                          {new Date(r.created_at).toLocaleDateString('ar-TN',
                            { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <Stars value={r.rating} size={12} />
                      {r.comment && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
                          marginTop: 6, lineHeight: 'var(--lh-relaxed)' }}>
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