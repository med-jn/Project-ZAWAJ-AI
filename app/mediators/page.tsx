'use client';
import { useState, useEffect } from 'react';
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';
import {
  Star, Users, Heart, ShieldCheck, BadgeCheck,
  Sparkles, Crown, Gem, Award, TrendingUp, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; // ← عدّل المسار حسب مشروعك

const supabase = createClient();

// ============================================================
// Types — مبنية على schema الحقيقي
// ============================================================
interface MediatorProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  mediator_level: string | null;
  current_monthly_subs: number | null;
  success_count: number | null;
  country: string | null;
  city: string | null;
  subscription_type: string | null;
  avg_rating?: number;
  review_count?: number;
  males_count?: number;
  females_count?: number;
}

// ============================================================
// Config
// ============================================================
const LEVEL_CONFIG: Record<string, { name: string; color: string; badge: string; icon: any }> = {
  '0': { name: 'مبتدئ',        color: '#808080', badge: 'Lv. 0', icon: Award     },
  '1': { name: 'وسيط فضي',     color: '#C0C0C0', badge: 'Lv. I', icon: Award     },
  '2': { name: 'وسيط بلاتيني', color: '#E5E4E2', badge: 'Lv. II', icon: Award    },
  '3': { name: 'وسيط ذهبي',    color: '#FFD700', badge: 'Lv. III', icon: Crown   },
  '4': { name: 'وسيط ياقوتي',  color: '#E4413E', badge: 'Lv. IV', icon: Gem      },
  '5': { name: 'وسيط ملكي',    color: '#D4AF37', badge: 'Lv. V',  icon: Sparkles },
};

const PLAN_PRICES: Record<string, { monthly: number; yearly: number; label: string }> = {
  silver: { monthly: 19,  yearly: 149, label: 'فضي'  },
  gold:   { monthly: 35,  yearly: 280, label: 'ذهبي' },
  royal:  { monthly: 55,  yearly: 449, label: 'ملكي' },
};

const getLvl = (level: string | null) =>
  LEVEL_CONFIG[level ?? '0'] ?? LEVEL_CONFIG['0'];

// ============================================================
// StarRating
// ============================================================
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={13}
            className={i <= Math.round(rating) ? 'text-[#FFD700]' : 'text-white/20'}
            fill={i <= Math.round(rating) ? '#FFD700' : 'none'} />
        ))}
      </div>
      <span className="text-white/50 text-[11px] font-bold">{rating.toFixed(1)}</span>
      <span className="text-white/25 text-[10px]">({count})</span>
    </div>
  );
}

// ============================================================
// LevelBadge
// ============================================================
function LevelBadge({ level }: { level: string | null }) {
  const cfg = getLvl(level);
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black"
      style={{ borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}12`, color: cfg.color }}>
      <Icon size={11} />
      <span>{cfg.name}</span>
      <span className="opacity-50 text-[9px]">{cfg.badge}</span>
    </div>
  );
}

// ============================================================
// Modal الاشتراك
// ============================================================
function SubscriptionModal({ mediator, currentUserId, onClose }: {
  mediator: MediatorProfile;
  currentUserId: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const planKey = mediator.subscription_type ?? 'silver';
  const prices = PLAN_PRICES[planKey] ?? PLAN_PRICES.silver;
  const cfg = getLvl(mediator.mediator_level);

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    try {
      // تحقق من الاشتراك المسبق
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('mediator_id', mediator.id)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        setError('أنت مشترك بالفعل مع هذا الوسيط');
        setLoading(false);
        return;
      }

      // إنشاء الاشتراك
      const amount = selected === 'monthly' ? prices.monthly : prices.yearly;
      const { error: subErr } = await supabase.from('subscriptions').insert({
        user_id: currentUserId,
        mediator_id: mediator.id,
        tier: selected,
        amount,
        status: 'active',
      });
      if (subErr) throw subErr;

      // إشعار للوسيط
      await supabase.from('notifications').insert({
        user_id: mediator.id,
        sender_id: currentUserId,
        type: 'new_subscriber',
        is_read: false,
      });

      setDone(true);
    } catch (e: any) {
      setError(e.message ?? 'حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-t-[36px] overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#120006 0%,#0D0008 100%)', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none' }}
        dir="rtl"
      >
        <div className="px-6 pt-6 pb-8">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

          {done ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-white font-black text-xl mb-2">تم الاشتراك بنجاح!</h3>
              <p className="text-white/40 text-sm mb-6">سيتواصل معك الوسيط قريباً</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                className="px-8 py-3 rounded-2xl font-black text-white"
                style={{ background: `linear-gradient(135deg,${cfg.color},#B2002D)` }}>
                رائع ✓
              </motion.button>
            </div>
          ) : (
            <>
              <h3 className="text-white font-black text-lg mb-1">
                اشترك مع {mediator.first_name} {mediator.last_name}
              </h3>
              <p className="text-white/40 text-xs mb-5">باقة {prices.label}</p>

              {/* مزايا الباقة */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[{ l: 'رسائل مباشرة', e: '💬' }, { l: 'أولوية المراجعة', e: '⚡' }, { l: 'تقرير شهري', e: '📊' }].map(f => (
                  <div key={f.l} className="py-3 px-2 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <div className="text-xl mb-1">{f.e}</div>
                    <p className="text-white/60 text-[10px] font-bold">{f.l}</p>
                  </div>
                ))}
              </div>

              {/* خيارات الدفع */}
              <div className="space-y-2.5 mb-5">
                {(['monthly', 'yearly'] as const).map(type => {
                  const price = type === 'monthly' ? prices.monthly : prices.yearly;
                  const isActive = selected === type;
                  return (
                    <motion.button key={type} whileTap={{ scale: 0.98 }} onClick={() => setSelected(type)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all"
                      style={{ background: isActive ? `${cfg.color}15` : 'rgba(255,255,255,0.03)', borderColor: isActive ? `${cfg.color}60` : 'rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: isActive ? cfg.color : 'rgba(255,255,255,0.2)' }}>
                          {isActive && <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />}
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">{type === 'monthly' ? 'شهري' : 'سنوي'}</p>
                          {type === 'yearly' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                              style={{ background: `${cfg.color}25`, color: cfg.color }}>وفر 32%</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-black text-xl">{price}</span>
                        <span className="text-white/40 text-xs"> دج/{type === 'monthly' ? 'شهر' : 'سنة'}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubscribe} disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg,${cfg.color},#B2002D)`, boxShadow: `0 8px 24px -4px ${cfg.color}40` }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={16} /> اشترك الآن ✦</>}
              </motion.button>
              <p className="text-center text-white/25 text-[10px] mt-3">يمكن الإلغاء في أي وقت · دفع آمن</p>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// بطاقة الوسيط
// ============================================================
function MediatorCard({ mediator, isActive, onSubscribe }: {
  mediator: MediatorProfile;
  isActive: boolean;
  onSubscribe: () => void;
}) {
  const cfg = getLvl(mediator.mediator_level);
  const planKey = mediator.subscription_type ?? 'silver';
  const prices = PLAN_PRICES[planKey] ?? PLAN_PRICES.silver;
  const total = (mediator.males_count ?? 0) + (mediator.females_count ?? 0);
  const malePercent = total > 0 ? Math.round(((mediator.males_count ?? 0) / total) * 100) : 50;
  const initials = `${mediator.first_name?.[0] ?? ''}${mediator.last_name?.[0] ?? ''}`;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#160008 0%,#0D0008 60%,#0a0015 100%)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%,${cfg.color}18 0%,transparent 65%)` }} />

      {/* Plan badge */}
      <div className="absolute top-5 right-5 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black"
          style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}40`, color: cfg.color }}>
          <cfg.icon size={10} />
          <span>باقة {prices.label}</span>
        </div>
      </div>

      {/* المدينة */}
      {mediator.city && (
        <div className="absolute top-5 left-5 z-10">
          <span className="text-white/30 text-[10px] font-bold">📍 {mediator.city}</span>
        </div>
      )}

      {/* Avatar */}
      <div className="flex justify-center pt-14 pb-4">
        <div className="relative">
          <motion.div
            animate={isActive ? { rotate: 360 } : {}}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute rounded-full pointer-events-none"
            style={{ inset: -3, background: `conic-gradient(${cfg.color},transparent,${cfg.color})`, borderRadius: '50%' }}
          />
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white relative z-10 border-2 border-[#0D0008] overflow-hidden"
            style={{ background: `linear-gradient(135deg,${cfg.color}60,#B2002D80)` }}>
            {mediator.avatar_url
              ? <img src={mediator.avatar_url} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="absolute -bottom-1 -right-1 z-20 bg-sky-500 rounded-full p-1 border-2 border-[#0D0008]">
            <BadgeCheck size={13} className="text-white" />
          </div>
        </div>
      </div>

      {/* الاسم + المستوى */}
      <div className="px-6 text-center mb-3">
        <h2 className="text-white font-black text-xl mb-1.5">{mediator.first_name} {mediator.last_name}</h2>
        <div className="flex justify-center">
          <LevelBadge level={mediator.mediator_level} />
        </div>
      </div>

      {/* التقييم */}
      <div className="flex justify-center mb-4">
        <StarRating rating={mediator.avg_rating ?? 0} count={mediator.review_count ?? 0} />
      </div>

      <div className="mx-6 h-px bg-white/5 mb-4" />

      {/* الإحصاءات */}
      <div className="px-5 mb-4">
        {/* المشتركون */}
        <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-3.5 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-[11px] font-bold flex items-center gap-1.5"><Users size={12} /> المشتركون</span>
            <span className="text-white/60 text-[11px] font-black">{total} عضو</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1.5">
            <div className="h-full rounded-full" style={{ width: `${malePercent}%`, background: 'linear-gradient(90deg,#4B9EFF,#2563EB)' }} />
          </div>
          <div className="flex justify-between">
            <span className="text-[#4B9EFF] text-[10px] font-black">♂ {mediator.males_count ?? 0} ذكر</span>
            <span className="text-[#FF6B9E] text-[10px] font-black">♀ {mediator.females_count ?? 0} أنثى</span>
          </div>
        </div>

        {/* نسبة التوفيق + الشهر الحالي */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={13} style={{ color: cfg.color }} />
              <span className="text-white/40 text-[10px]">إجمالي الزيجات</span>
            </div>
            <span className="font-black text-2xl" style={{ color: cfg.color }}>{mediator.success_count ?? 0}</span>
          </div>
          <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Heart size={13} className="text-rose-400" />
              <span className="text-white/40 text-[10px]">هذا الشهر</span>
            </div>
            <span className="font-black text-2xl text-white">{mediator.current_monthly_subs ?? 0}</span>
          </div>
        </div>
      </div>

      {/* النبذة */}
      {mediator.bio && (
        <div className="px-5 mb-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3">
            <p className="text-white/55 text-[12px] leading-relaxed text-right line-clamp-3">{mediator.bio}</p>
          </div>
        </div>
      )}

      {/* زر الاشتراك */}
      <div className="px-5 pb-6 mt-auto">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onSubscribe}
          className="w-full py-4 rounded-2xl font-black text-[15px] text-white"
          style={{ background: `linear-gradient(135deg,${cfg.color}CC,#B2002D)`, boxShadow: `0 8px 28px -6px ${cfg.color}50` }}>
          <span className="flex items-center justify-center gap-2">
            <Sparkles size={16} />
            اشترك مع {mediator.first_name}
          </span>
        </motion.button>
        <p className="text-center text-white/25 text-[10px] mt-2">ابتداءً من {prices.monthly} دج/شهر</p>
      </div>
    </div>
  );
}

// ============================================================
// الصفحة الرئيسية
// ============================================================
export default function MediatorsPage() {
  const [mediators, setMediators] = useState<MediatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [subscribeTarget, setSubscribeTarget] = useState<MediatorProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const x = useMotionValue(0);

  // جلب المستخدم الحالي
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  // جلب الوسطاء مع إحصاءاتهم
  useEffect(() => {
    const fetchMediators = async () => {
      setLoading(true);
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id,first_name,last_name,username,avatar_url,bio,mediator_level,current_monthly_subs,success_count,country,city,subscription_type')
          .eq('role', 'mediator')
          .order('success_count', { ascending: false });

        if (error || !profiles) throw error;

        const enriched = await Promise.all(
          profiles.map(async (p) => {
            // متوسط التقييم
            const { data: reviews } = await supabase
              .from('mediator_reviews')
              .select('rating')
              .eq('mediator_id', p.id);

            const avg_rating = reviews?.length
              ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length
              : 0;

            // عدد الذكور المشتركين
            const { count: malesCount } = await supabase
              .from('subscriptions')
              .select('user_id, profiles!inner(gender)', { count: 'exact', head: true })
              .eq('mediator_id', p.id)
              .eq('status', 'active')
              .eq('profiles.gender', 'male');

            // عدد الإناث المشتركات
            const { count: femalesCount } = await supabase
              .from('subscriptions')
              .select('user_id, profiles!inner(gender)', { count: 'exact', head: true })
              .eq('mediator_id', p.id)
              .eq('status', 'active')
              .eq('profiles.gender', 'female');

            return {
              ...p,
              avg_rating,
              review_count: reviews?.length ?? 0,
              males_count: malesCount ?? 0,
              females_count: femalesCount ?? 0,
            } as MediatorProfile;
          })
        );

        setMediators(enriched);
      } catch (e) {
        console.error('خطأ في جلب الوسطاء:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMediators();
  }, []);

  const goTo = (index: number) => {
    if (index < 0 || index >= mediators.length) {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
      return;
    }
    setCurrentIndex(index);
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 28 });
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -400) goTo(currentIndex + 1);
    else if (info.offset.x > 80 || info.velocity.x > 400) goTo(currentIndex - 1);
    else animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0008' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
          <p className="text-white/40 text-sm font-bold">جارٍ تحميل الوسطاء...</p>
        </div>
      </div>
    );
  }

  if (!mediators.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0008' }}>
        <p className="text-white/40 font-bold">لا يوجد وسطاء متاحون حالياً</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#0D0008', color: 'white', fontFamily: 'Cairo, sans-serif' }}
      dir="rtl">

      {/* Header */}
      <div className="px-6 pt-24 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={18} className="text-[#D4AF37]" />
          <span className="text-[#D4AF37] text-xs font-black uppercase tracking-widest">Mediators</span>
        </div>
        <h1 className="text-3xl font-black text-white">وسطاء الزواج</h1>
        <p className="text-white/40 text-sm mt-1">اسحب يميناً أو يساراً لاستعراض الوسطاء</p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mb-4">
        {mediators.map((_, i) => (
          <motion.div key={i}
            animate={{ width: i === currentIndex ? 20 : 6, opacity: i === currentIndex ? 1 : 0.3 }}
            className="h-1.5 rounded-full bg-[#D4AF37]"
          />
        ))}
      </div>

      {/* Cards */}
      <div className="flex-1 relative flex items-start justify-center overflow-hidden px-4"
        style={{ minHeight: 570 }}>
        {mediators.map((mediator, i) => {
          const offset = i - currentIndex;
          const isActive = offset === 0;
          if (Math.abs(offset) > 2) return null;
          return (
            <motion.div key={mediator.id}
              style={{
                position: 'absolute', width: 320, height: 570,
                x: isActive ? x : offset * 30,
                zIndex: 10 - Math.abs(offset),
                transformOrigin: 'bottom center',
              }}
              animate={{
                scale: isActive ? 1 : 1 - Math.abs(offset) * 0.05,
                y: Math.abs(offset) * 12,
                opacity: isActive ? 1 : 1 - Math.abs(offset) * 0.35,
                rotateZ: isActive ? 0 : offset * 2.5,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag={isActive ? 'x' : false}
              dragConstraints={{ left: -200, right: 200 }}
              dragElastic={0.15}
              onDragEnd={isActive ? handleDragEnd : undefined}
              whileDrag={{ cursor: 'grabbing' }}
            >
              <MediatorCard
                mediator={mediator}
                isActive={isActive}
                onSubscribe={() => setSubscribeTarget(mediator)}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Arrows */}
      <div className="flex justify-center items-center gap-8 py-5">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center disabled:opacity-20">
          <ChevronRight size={20} className="text-white/70" />
        </motion.button>
        <span className="text-white/30 text-sm font-bold">{currentIndex + 1} / {mediators.length}</span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === mediators.length - 1}
          className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center disabled:opacity-20">
          <ChevronLeft size={20} className="text-white/70" />
        </motion.button>
      </div>

      <div className="h-[65px]" />

      {/* Modal */}
      {subscribeTarget && currentUserId && (
        <SubscriptionModal
          mediator={subscribeTarget}
          currentUserId={currentUserId}
          onClose={() => setSubscribeTarget(null)}
        />
      )}
    </div>
  );
}