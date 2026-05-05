'use client';
/**
 * app/mediators/page.tsx
 * نظام اشتراك حقيقي:
 * زر اشتراك بارز → sheet اختيار الباقة → تأكيد (رصيد قبل/بعد) → Edge Function → شاشة نجاح
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence }           from 'framer-motion';
import {
  Star, Users, MessageCircle, Flag,
  MapPin, ChevronLeft, X, Crown, Send,
  Check, Sparkles, Clock, Shield,
} from 'lucide-react';
import { supabase }  from '@/lib/supabase/client';
import { LoveCoin }  from '@/components/ui/LoveCoin';
import { toast }     from 'sonner';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface MediatorRow {
  id: string; full_name: string; avatar_url: string | null;
  bio: string | null; city: string | null; country: string | null;
  success_count: number; mediator_level: string;
  avg_rating: number; rating_count: number;
  male_count: number; female_count: number;
  isSubscribed: boolean;
}
interface Subscriber {
  id: string; full_name: string; avatar_url: string | null;
  age: number | null; city: string | null; gender: string;
  profile_completion_percent: number;
}
interface SuccessData {
  mediatorName: string;
  userName: string;
  coins: number;
  subscribedAt: Date;
  expiresAt: Date;
}

/* ─────────────────────────────────────────────
   الباقات
───────────────────────────────────────────── */
const TIERS = [
  {
    coins: 2000,
    label: 'أساسية',
    desc:  'دخول قائمة المشتركين وتواصل مع الوسيط',
    perks: ['ظهور في قائمة المشتركين', 'تواصل مع الوسيط', 'صالحة 30 يوم'],
    accent: 'rgba(179,51,75,0.18)',
    border: 'var(--border-soft)',
    glow:  'rgba(179,51,75,0.30)',
  },
  {
    coins: 3000,
    label: 'متميزة',
    desc:  'أولوية في المطابقة وبروفايل مميز',
    perks: ['كل مزايا الأساسية', 'أولوية في المطابقة', 'بروفايل مميز للوسيط', 'صالحة 30 يوم'],
    accent: 'rgba(212,175,55,0.15)',
    border: 'var(--border-gold)',
    glow:  'rgba(212,175,55,0.35)',
    popular: true,
  },
  {
    coins: 5000,
    label: 'فخرية',
    desc:  'أقصى مستوى من الاهتمام والأولوية',
    perks: ['كل مزايا المتميزة', 'أعلى أولوية في المطابقة', 'جلسة تعارف مخصصة', 'صالحة 30 يوم'],
    accent: 'rgba(178,235,242,0.12)',
    border: 'rgba(178,235,242,0.35)',
    glow:  'rgba(178,235,242,0.25)',
  },
] as const;

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function Stars({ value, size = 13, interactive = false, onChange }: {
  value: number; size?: number; interactive?: boolean; onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const on = (interactive ? hover || value : value) > i;
        return (
          <Star key={i} size={size}
            fill={on ? '#D4AF37' : 'none'}
            stroke={on ? '#D4AF37' : 'rgba(255,255,255,0.2)'}
            className={interactive ? 'cursor-pointer' : ''}
            onMouseEnter={() => interactive && setHover(i + 1)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onChange?.(i + 1)}
          />
        );
      })}
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const key = (level ?? '').toLowerCase();
  const map: Record<string, { label: string; color: string; bg: string }> = {
    none:     { label: 'مبتدئ',    color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
    bronze:   { label: 'برونزي',  color: '#CD7F32', bg: 'rgba(205,127,50,0.15)'  },
    silver:   { label: 'فضي',     color: '#C0C0C0', bg: 'rgba(192,192,192,0.15)' },
    gold:     { label: 'ذهبي',    color: '#D4AF37', bg: 'rgba(212,175,55,0.2)'   },
    platinum: { label: 'بلاتيني', color: '#E5E4E2', bg: 'rgba(229,228,226,0.15)' },
    diamond:  { label: 'ماسي',    color: '#B2EBF2', bg: 'rgba(178,235,242,0.18)' },
  };
  const c = map[key] ?? map.none;
  return (
    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black"
      style={{ color: c.color, background: c.bg }}>{c.label}</span>
  );
}

/* ── شاشة النجاح ── */
function SuccessScreen({ data, onClose }: { data: SuccessData; onClose: () => void }) {
  const fmt = (d: Date) =>
    d.toLocaleDateString('ar-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed inset-0 z-[600] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)' }}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-full rounded-t-[32px] overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', maxHeight: '90vh' }}
      >
        {/* الجزء العلوي المتدرج */}
        <div className="relative pt-12 pb-8 px-6 flex flex-col items-center"
          style={{ background: 'linear-gradient(160deg, rgba(34,197,94,0.12) 0%, transparent 60%)' }}>

          {/* أيقونة النجاح */}
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.15 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}
          >
            <Check size={38} style={{ color: '#22c55e' }} strokeWidth={3} />
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="font-black text-center mb-1"
            style={{ fontSize: 'var(--text-xl)', color: 'var(--text-main)' }}>
            تم الاشتراك بنجاح! 🎉
          </motion.h2>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-center"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            أهلاً بك في عائلة الوسيط
          </motion.p>
        </div>

        {/* تفاصيل الاشتراك */}
        <div className="px-5 pb-4 space-y-3">

          {/* بطاقة الوسيط */}
          <div className="rounded-[20px] p-4"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <p className="text-[10px] font-black tracking-widest uppercase mb-3"
              style={{ color: 'var(--text-tertiary)' }}>تفاصيل الاشتراك</p>

            <div className="space-y-3">
              <Row icon="👤" label="المشترك"  value={data.userName} />
              <Row icon="🤝" label="الوسيط"   value={data.mediatorName} />
              <Row icon={<LoveCoin size={14} />} label="العملات المدفوعة"
                value={`${data.coins.toLocaleString('ar-TN')}`} />
            </div>
          </div>

          {/* التاريخ والصلاحية */}
          <div className="rounded-[20px] p-4"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="space-y-3">
              <Row icon={<Clock size={14} style={{ color: '#22c55e' }} />}
                label="تاريخ الاشتراك"
                value={`${fmt(data.subscribedAt)} — ${fmtTime(data.subscribedAt)}`}
                valueColor="#22c55e" />
              <Row icon={<Shield size={14} style={{ color: '#22c55e' }} />}
                label="صالح حتى"
                value={fmt(data.expiresAt)}
                valueColor="#22c55e" />
            </div>
          </div>
        </div>

        {/* زر الإغلاق */}
        <div className="px-5 pb-10 pt-2">
          <button onClick={onClose}
            className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #800020, var(--color-primary))',
              boxShadow: '0 8px 24px var(--shadow-red-glow)', fontSize: 'var(--text-sm)' }}>
            <Crown size={16} /> عودة للوسطاء
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ icon, label, value, valueColor }: {
  icon: React.ReactNode; label: string; value: string; valueColor?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--text-tertiary)', lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <span className="font-black text-right"
        style={{ fontSize: 'var(--text-xs)', color: valueColor ?? 'var(--text-main)', maxWidth: '60%' }}>
        {value}
      </span>
    </div>
  );
}

/* ── sheet اختيار الباقة + تأكيد ── */
function SubscribeSheet({
  mediator, balance, userName,
  onClose, onSuccess,
}: {
  mediator: MediatorRow; balance: number; userName: string;
  onClose: () => void; onSuccess: (d: SuccessData) => void;
}) {
  const [selectedTier, setSelectedTier] = useState<typeof TIERS[number] | null>(null);
  const [confirming,   setConfirming]   = useState(false);
  const [loading,      setLoading]      = useState(false);

  const handleConfirm = async () => {
    if (!selectedTier) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/subscribe-to-mediator`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            Authorization:   `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ mediator_id: mediator.id, coins: selectedTier.coins }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'فشل الاشتراك');
        setLoading(false);
        return;
      }

      const now     = new Date();
      const expires = new Date(data.expires_at);
      onSuccess({
        mediatorName: mediator.full_name,
        userName,
        coins:        selectedTier.coins,
        subscribedAt: now,
        expiresAt:    expires,
      });
    } catch {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const balanceAfter = balance - (selectedTier?.coins ?? 0);
  const hasEnough    = balanceAfter >= 0;

  return (
    <>
      {/* overlay */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500]"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
        onClick={() => !loading && onClose()}
      />

      {/* sheet */}
      <motion.div dir="rtl"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-[510] rounded-t-[32px] flex flex-col"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', maxHeight: '92vh' }}
      >
        {/* handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--glass-border)' }} />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] overflow-hidden"
              style={{ border: '1.5px solid var(--border-gold)' }}>
              {mediator.avatar_url
                ? <img src={mediator.avatar_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'var(--bg-soft)' }}>🤝</div>}
            </div>
            <div>
              <p className="font-black" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                اشتراك مع {mediator.full_name}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>اختر الباقة المناسبة</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <X size={15} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">

          {/* رصيدي */}
          <div className="mx-5 mt-4 mb-2 px-4 py-3 rounded-[16px] flex items-center justify-between"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>رصيدك الحالي</span>
            <span className="flex items-center gap-1.5 font-black"
              style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
              {balance.toLocaleString('ar-TN')} <LoveCoin size={16} />
            </span>
          </div>

          {/* الباقات */}
          <AnimatePresence mode="wait">
            {!confirming ? (
              <motion.div key="tiers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-5 pt-2 pb-4 space-y-3">
                {TIERS.map((tier, idx) => (
                  <motion.button
                    key={tier.coins}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => {
                      setSelectedTier(tier);
                      setConfirming(true);
                    }}
                    className="w-full text-right rounded-[22px] p-4 relative overflow-hidden"
                    style={{
                      background: tier.accent,
                      border: `1.5px solid ${tier.border}`,
                      boxShadow: balance >= tier.coins ? `0 4px 20px ${tier.glow}` : 'none',
                      opacity: balance >= tier.coins ? 1 : 0.45,
                    }}
                    disabled={balance < tier.coins}
                  >
                    {/* الأحرف الزخرفية */}
                    {tier.popular && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black"
                        style={{ background: 'var(--border-gold)', color: '#D4AF37' }}>
                        الأشهر
                      </span>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black" style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
                        {tier.label}
                      </span>
                      <span className="flex items-center gap-1.5 font-black"
                        style={{ fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}>
                        {tier.coins.toLocaleString('ar-TN')} <LoveCoin size={18} />
                      </span>
                    </div>

                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 10 }}>
                      {tier.desc}
                    </p>

                    <div className="space-y-1.5">
                      {tier.perks.map(p => (
                        <div key={p} className="flex items-center gap-2">
                          <Check size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
                          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>{p}</span>
                        </div>
                      ))}
                    </div>

                    {balance < tier.coins && (
                      <p className="mt-2 text-[10px] font-bold" style={{ color: 'var(--color-primary)' }}>
                        رصيد غير كافٍ (تحتاج {(tier.coins - balance).toLocaleString('ar-TN')} إضافية)
                      </p>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              /* ── لوحة التأكيد ── */
              <motion.div key="confirm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} className="px-5 pt-3 pb-4 space-y-4">

                {/* ملخص الباقة */}
                <div className="rounded-[20px] p-4"
                  style={{ background: selectedTier?.accent, border: `1.5px solid ${selectedTier?.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black" style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
                      باقة {selectedTier?.label}
                    </span>
                    <span className="flex items-center gap-1.5 font-black"
                      style={{ fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}>
                      {selectedTier?.coins.toLocaleString('ar-TN')} <LoveCoin size={18} />
                    </span>
                  </div>
                  <div className="h-px" style={{ background: 'var(--glass-border)' }} />
                  <div className="mt-3 space-y-2">
                    <ConfirmRow label="الرصيد الحالي" value={balance} />
                    <ConfirmRow label="العملات المخصومة"
                      value={-(selectedTier?.coins ?? 0)} isNeg />
                    <div className="h-px" style={{ background: 'var(--glass-border)' }} />
                    <ConfirmRow label="الرصيد بعد الاشتراك"
                      value={balanceAfter}
                      isNeg={balanceAfter < 0}
                      isBold />
                  </div>
                </div>

                {/* معلومات إضافية */}
                <div className="rounded-[18px] p-4 space-y-2"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                  <div className="flex items-center gap-2">
                    <Clock size={13} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      مدة الاشتراك: <strong style={{ color: 'var(--text-main)' }}>30 يوم</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={13} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      الوسيط: <strong style={{ color: 'var(--text-main)' }}>{mediator.full_name}</strong>
                    </span>
                  </div>
                  {!hasEnough && (
                    <div className="flex items-center gap-2">
                      <X size={13} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)' }}>
                        رصيد غير كافٍ للمتابعة
                      </span>
                    </div>
                  )}
                </div>

                {/* أزرار */}
                <div className="flex gap-3">
                  <button onClick={() => setConfirming(false)} disabled={loading}
                    className="flex-1 py-3.5 rounded-2xl font-black"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                      color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                    تغيير الباقة
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirm}
                    disabled={loading || !hasEnough}
                    className="flex-[2] py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                    style={{
                      background: hasEnough
                        ? 'linear-gradient(135deg, #800020, var(--color-primary))'
                        : 'var(--glass-bg)',
                      boxShadow: hasEnough ? '0 8px 24px var(--shadow-red-glow)' : 'none',
                      color: hasEnough ? '#fff' : 'var(--text-tertiary)',
                      fontSize: 'var(--text-sm)',
                      opacity: loading ? 0.7 : 1,
                    }}>
                    {loading
                      ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-t-transparent rounded-full border-white" />
                      : <><Sparkles size={15} /> تأكيد الاشتراك</>}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

function ConfirmRow({ label, value, isNeg, isBold }: {
  label: string; value: number; isNeg?: boolean; isBold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</span>
      <span className={`flex items-center gap-1 ${isBold ? 'font-black' : 'font-bold'}`}
        style={{
          fontSize: isBold ? 'var(--text-base)' : 'var(--text-xs)',
          color: isNeg ? 'var(--color-primary)' : '#22c55e',
        }}>
        {value > 0 && !isNeg && '+'}{value.toLocaleString('ar-TN')} <LoveCoin size={isBold ? 14 : 12} />
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   الصفحة الرئيسية
───────────────────────────────────────────── */
export default function MediatorsPage() {
  const [mediators,   setMediators]   = useState<MediatorRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [balance,     setBalance]     = useState(0);
  const [selected,    setSelected]    = useState<MediatorRow | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subLoading,  setSubLoading]  = useState(false);
  const [showRate,    setShowRate]    = useState(false);
  const [myRating,    setMyRating]    = useState(0);
  const [myComment,   setMyComment]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [showReport,  setShowReport]  = useState(false);

  // نظام الاشتراك
  const [subscribeTarget, setSubscribeTarget] = useState<MediatorRow | null>(null);
  const [successData,     setSuccessData]     = useState<SuccessData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let myProfile: any = null;

    if (user) {
      const [profileRes, walletRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, gender, mediator_id').eq('id', user.id).single(),
        supabase.from('wallets').select('balance').eq('id', user.id).single(),
      ]);
      myProfile = profileRes.data;
      setBalance(walletRes.data?.balance ?? 0);
    }
    setCurrentUser(myProfile);

    const { data, error } = await supabase.rpc('get_mediators');
    if (error) { console.error('[Mediators]', error.message); setLoading(false); return; }

    const rows: MediatorRow[] = (data ?? []).map((m: any) => ({
      ...m,
      avg_rating:   Number(m.avg_rating ?? 0),
      isSubscribed: myProfile?.mediator_id === m.id,
    }));
    rows.sort((a, b) => b.avg_rating - a.avg_rating);
    setMediators(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openMediator = async (m: MediatorRow) => {
    setSelected(m); setShowRate(false); setShowReport(false); setSubLoading(true);
    const oppGender = currentUser?.gender === 'male' ? 'female' : 'male';
    const { data } = await supabase.from('profiles')
      .select('id, full_name, avatar_url, age, city, gender, profile_completion_percent')
      .eq('mediator_id', m.id).eq('gender', oppGender);
    setSubscribers(data ?? []); setSubLoading(false);
  };

  const submitRating = async () => {
    if (!currentUser || !selected || myRating === 0) return;
    setSubmitting(true);
    await supabase.from('mediator_reviews').upsert({
      mediator_id: selected.id, id: currentUser.id,
      rating: myRating, comment: myComment || null,
    }, { onConflict: 'mediator_id,id' });
    setShowRate(false); setMyRating(0); setMyComment('');
    setSubmitting(false); load();
  };

  const reportMediator = async () => {
    if (!currentUser || !selected) return;
    await supabase.from('reports').insert({
      reporter_id: currentUser.id, reported_id: selected.id, reason: 'بلاغ عن وسيط',
    });
    setShowReport(false);
    toast.success('تم إرسال البلاغ');
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-5xl">🤝</motion.div>
    </div>
  );

  return (
    <div className="min-h-full px-4 py-5" dir="rtl" style={{ background: 'var(--bg-main)' }}>

      {/* رصيدي في الأعلى */}
      {currentUser && (
        <div className="flex items-center justify-between mb-4 px-1">
          <h1 className="font-black" style={{ fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}>
            الوسطاء
          </h1>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <span className="font-black" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
              {balance.toLocaleString('ar-TN')}
            </span>
            <LoveCoin size={16} />
          </div>
        </div>
      )}

      {mediators.length === 0 && (
        <div className="text-center py-24">
          <Crown size={40} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-bold" style={{ color: 'var(--text-tertiary)' }}>لا يوجد وسطاء</p>
        </div>
      )}

      <div className="space-y-4">
        {mediators.map((m, i) => (
          <motion.div key={m.id}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-[28px] p-5"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-soft)' }}
          >
            {/* هيدر */}
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-[18px] overflow-hidden"
                  style={{ border: '2px solid var(--border-gold)' }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt={m.full_name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl"
                        style={{ background: 'var(--bg-soft)' }}>🤝</div>}
                </div>
                {i < 3 && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{ background: i===0?'#D4AF37':i===1?'#C0C0C0':'#CD7F32', color:'#000' }}>
                    {i + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black" style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
                    {m.full_name}
                  </h3>
                  <LevelBadge level={m.mediator_level} />
                </div>
                {m.city && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={11} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {m.city}{m.country ? `، ${m.country}` : ''}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Stars value={m.avg_rating} size={12} />
                  <span className="font-bold" style={{ fontSize: 'var(--text-xs)', color: '#D4AF37' }}>
                    {m.avg_rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                    ({m.rating_count} تقييم)
                  </span>
                </div>
              </div>
            </div>

            {/* إحصائيات */}
            <div className="flex gap-2 mt-4">
              {[
                { label:'ذكور',  val:m.male_count,    color:'#60A5FA', bg:'rgba(59,130,246,0.08)'  },
                { label:'إناث',  val:m.female_count,  color:'#F472B6', bg:'rgba(236,72,153,0.08)'  },
                { label:'نجاح',  val:m.success_count, color:'#4ADE80', bg:'rgba(34,197,94,0.08)'   },
              ].map(s => (
                <div key={s.label} className="flex-1 rounded-2xl px-2 py-2 text-center"
                  style={{ background:s.bg, border:`1px solid ${s.color}25` }}>
                  <p className="font-black" style={{ fontSize: 'var(--text-base)', color:s.color }}>{s.val}</p>
                  <p className="font-bold" style={{ fontSize: 'var(--text-2xs)', color:`${s.color}80` }}>{s.label}</p>
                </div>
              ))}
            </div>

            {m.bio && (
              <p className="mt-3 line-clamp-2"
                style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--lh-relaxed)', color:'var(--text-secondary)' }}>
                {m.bio}
              </p>
            )}

            {/* ── الأزرار — زر الاشتراك بارز ── */}
            <div className="mt-4 space-y-2">

              {/* زر الاشتراك — يمتد بالكامل */}
              {m.isSubscribed ? (
                <div className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black"
                  style={{ background:'rgba(212,175,55,0.12)', border:'1px solid var(--border-gold)',
                    fontSize: 'var(--text-sm)', color:'#D4AF37' }}>
                  <Crown size={16} /> أنت مشترك حالياً ✓
                </div>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => currentUser && setSubscribeTarget(m)}
                  disabled={!currentUser}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-white"
                  style={{
                    background: 'linear-gradient(135deg, #800020, var(--color-primary))',
                    boxShadow: '0 8px 24px var(--shadow-red-glow)',
                    fontSize: 'var(--text-sm)',
                    opacity: currentUser ? 1 : 0.5,
                  }}>
                  <Crown size={16} /> اشتراك الآن
                </motion.button>
              )}

              {/* الأزرار الثانوية */}
              <div className="flex gap-2">
                <motion.button whileTap={{scale:0.9}}
                  className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-bold"
                  style={{ background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)',
                    fontSize: 'var(--text-xs)', color:'#38BDF8' }}>
                  <MessageCircle size={15}/> رسالة
                </motion.button>

                <motion.button whileTap={{scale:0.9}}
                  onClick={() => openMediator(m)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
                  <ChevronLeft size={17} style={{ color:'var(--text-tertiary)' }} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Subscribe Sheet ── */}
      <AnimatePresence>
        {subscribeTarget && !successData && (
          <SubscribeSheet
            mediator={subscribeTarget}
            balance={balance}
            userName={currentUser?.full_name ?? 'مستخدم'}
            onClose={() => setSubscribeTarget(null)}
            onSuccess={(d) => {
              setSubscribeTarget(null);
              setSuccessData(d);
              load(); // تحديث بيانات الوسطاء والرصيد
            }}
          />
        )}
      </AnimatePresence>

      {/* ── شاشة النجاح ── */}
      <AnimatePresence>
        {successData && (
          <SuccessScreen
            data={successData}
            onClose={() => setSuccessData(null)}
          />
        )}
      </AnimatePresence>

      {/* ══ Bottom Sheet تفاصيل وسيط ══ */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-[300]"
              style={{ background:'rgba(0,0,0,0.72)', backdropFilter:'blur(8px)' }}
              onClick={() => { setSelected(null); setSubscribers([]); }} />

            <motion.div dir="rtl"
              initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
              transition={{ type:'spring', stiffness:320, damping:32 }}
              className="fixed bottom-0 left-0 right-0 z-[400] rounded-t-[32px] flex flex-col"
              style={{ background:'var(--bg-surface)', border:'1px solid var(--glass-border)', maxHeight:'88vh' }}
            >
              {/* هيدر */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom:'1px solid var(--glass-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[13px] overflow-hidden"
                    style={{ border:'1.5px solid var(--border-gold)' }}>
                    {selected.avatar_url
                      ? <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ background:'var(--bg-soft)' }}>🤝</div>}
                  </div>
                  <div>
                    <p className="font-black" style={{ fontSize:'var(--text-sm)', color:'var(--text-main)' }}>{selected.full_name}</p>
                    <Stars value={selected.avg_rating} size={11} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentUser?.mediator_id === selected.id && (
                    <button onClick={() => setShowRate(v => !v)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.2)' }}>
                      <Star size={14} style={{ color:'#D4AF37' }} />
                    </button>
                  )}
                  <button onClick={() => setShowReport(v => !v)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)' }}>
                    <Flag size={13} className="text-rose-400" />
                  </button>
                  <button onClick={() => { setSelected(null); setSubscribers([]); }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
                    <X size={15} style={{ color:'var(--text-tertiary)' }} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* نموذج التقييم */}
                <AnimatePresence>
                  {showRate && (
                    <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}
                      exit={{opacity:0,height:0}} className="rounded-[20px] p-4 space-y-3"
                      style={{ background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.2)' }}>
                      <p className="font-black" style={{ fontSize:'var(--text-sm)', color:'#D4AF37' }}>قيّم الوسيط</p>
                      <Stars value={myRating} size={28} interactive onChange={setMyRating} />
                      <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
                        placeholder="اكتب تعليقك..." rows={2}
                        className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
                        style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                          color:'var(--text-main)', fontFamily:'inherit', fontSize:'var(--text-sm)' }} />
                      <button onClick={submitRating} disabled={submitting || myRating===0}
                        className="w-full py-3 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                        style={{ background:'linear-gradient(135deg,#800020,var(--color-primary))',
                          opacity:myRating===0?0.4:1, fontSize:'var(--text-sm)' }}>
                        <Send size={13}/> {submitting ? 'جاري...' : 'إرسال التقييم'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* نموذج الإبلاغ */}
                <AnimatePresence>
                  {showReport && (
                    <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}
                      exit={{opacity:0,height:0}} className="rounded-[20px] p-4"
                      style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.18)' }}>
                      <p className="font-black mb-3" style={{ fontSize:'var(--text-sm)', color:'#f87171' }}>
                        الإبلاغ عن الوسيط
                      </p>
                      <div className="flex gap-2">
                        <button onClick={reportMediator}
                          className="flex-1 py-3 rounded-2xl font-black flex items-center justify-center gap-2"
                          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.22)',
                            color:'#f87171', fontSize:'var(--text-sm)' }}>
                          <Flag size={13}/> تأكيد البلاغ
                        </button>
                        <button onClick={() => setShowReport(false)}
                          className="px-5 py-3 rounded-2xl font-bold"
                          style={{ background:'var(--glass-bg)', color:'var(--text-tertiary)',
                            border:'1px solid var(--glass-border)', fontSize:'var(--text-sm)' }}>
                          إلغاء
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* النبذة */}
                {selected.bio && (
                  <div className="rounded-[20px] p-4"
                    style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
                    <p className="text-[10px] font-black tracking-widest uppercase mb-2"
                      style={{ color:'var(--text-tertiary)' }}>نبذة</p>
                    <p style={{ fontSize:'var(--text-sm)', lineHeight:'var(--lh-relaxed)', color:'var(--text-secondary)' }}>
                      {selected.bio}
                    </p>
                  </div>
                )}

                {/* المشتركون */}
                <div>
                  <p className="font-black mb-3" style={{ fontSize:'var(--text-sm)', color:'var(--text-main)' }}>
                    المشتركون ({currentUser?.gender==='male'?'الإناث':'الذكور'})
                  </p>
                  {subLoading && (
                    <div className="flex justify-center py-8">
                      <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:0.9,ease:'linear'}}
                        className="w-6 h-6 border-2 border-t-transparent rounded-full"
                        style={{ borderColor:'var(--color-primary)' }} />
                    </div>
                  )}
                  {!subLoading && subscribers.length===0 && (
                    <div className="text-center py-10">
                      <Users size={30} className="mx-auto mb-2" style={{ color:'var(--text-tertiary)' }} />
                      <p style={{ fontSize:'var(--text-sm)', color:'var(--text-tertiary)' }}>لا يوجد مشتركون بعد</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {subscribers.map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-[18px]"
                        style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
                        <div className="w-11 h-11 rounded-[12px] overflow-hidden flex-shrink-0">
                          {s.avatar_url
                            ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg"
                                style={{ background:'var(--bg-soft)' }}>
                                {s.gender==='female'?'👩':'👨'}
                              </div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black truncate" style={{ fontSize:'var(--text-sm)', color:'var(--text-main)' }}>
                            {s.full_name||'—'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {s.city && <span style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)' }}>📍 {s.city}</span>}
                            {s.age  && <span style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)' }}>{s.age} سنة</span>}
                          </div>
                          {s.profile_completion_percent > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-[3px] rounded-full overflow-hidden"
                                style={{ background:'var(--glass-border)' }}>
                                <div className="h-full rounded-full" style={{
                                  width:`${s.profile_completion_percent}%`,
                                  background: s.profile_completion_percent>=80?'#22c55e':s.profile_completion_percent>=50?'#D4AF37':'var(--color-primary)',
                                }} />
                              </div>
                              <span className="font-bold" style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)' }}>
                                {s.profile_completion_percent}%
                              </span>
                            </div>
                          )}
                        </div>
                        <button className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
                          <ChevronLeft size={14} style={{ color:'var(--text-tertiary)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* أزرار الـ Sheet */}
              <div className="px-5 pb-8 pt-3 flex gap-3"
                style={{ borderTop:'1px solid var(--glass-border)' }}>
                {selected.isSubscribed ? (
                  <div className="flex-[2] py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black"
                    style={{ background:'rgba(212,175,55,0.1)', border:'1px solid var(--border-gold)',
                      fontSize:'var(--text-sm)', color:'#D4AF37' }}>
                    <Crown size={16} /> مشترك ✓
                  </div>
                ) : (
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelected(null); setSubscribeTarget(selected); }}
                    disabled={!currentUser}
                    className="flex-[2] py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                    style={{ background:'linear-gradient(135deg,#800020,var(--color-primary))',
                      boxShadow:'0 8px 24px var(--shadow-red-glow)', fontSize:'var(--text-sm)' }}>
                    <Crown size={14}/> اشتراك الآن
                  </motion.button>
                )}
                <motion.button whileTap={{scale:0.9}}
                  className="flex-1 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2"
                  style={{ background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)',
                    fontSize:'var(--text-sm)', color:'#38BDF8' }}>
                  <MessageCircle size={14}/> رسالة
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}