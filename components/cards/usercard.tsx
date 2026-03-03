// 📁 components/cards/usercard.tsx
'use client';

import { useRef, useState, useCallback } from 'react';
import {
  motion, useMotionValue, useTransform,
  animate, AnimatePresence
} from 'framer-motion';
import { MessageCircle, MoreHorizontal, X, Heart, Flag, ShieldOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { AutoBadge } from '@/components/auto-badge';
import {
  ECONOMY_SETTINGS, COMMITTED_LEVELS,
  getNationality, getEducationLabel,
  getMaritalLabel, getHousingLabel, getReligiousLabel,
} from '@/constants/constants';

const C = ECONOMY_SETTINGS.GENERAL_INTERFACE;

// ─── أيقونات SVG مضمّنة ───────────────────
const IC: Record<string, React.ReactNode> = {
  pin:    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  brief:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  edu:    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  heart:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.78-8.78a5.5 5.5 0 000-7.78z"/></svg>,
  shield: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  home:   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  money:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  pulse:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  child:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  ruler:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M7 7l5-5 5 5M7 17l5 5 5-5"/></svg>,
  globe:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  plane:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>,
  users:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  chat:   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  star:   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  sun:    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  book:   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  smoke:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 8c1.7 0 3 1.3 3 3v2H8v-2c0-1.7 1.3-3 3-3"/><line x1="2" y1="13" x2="8" y2="13"/></svg>,
  check:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  search: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  ring:   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18"/></svg>,
  color:  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 000 20"/></svg>,
};

// ─── صف بيانات ────────────────────────────
const Row = ({ icon, label, value }: {
  icon: React.ReactNode; label: string; value?: string | number | null
}) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0" dir="rtl">
      <span className="text-[#A4161A]/75 flex-shrink-0">{icon}</span>
      <span className="text-white/28 text-[11px] flex-shrink-0" style={{ minWidth: 110 }}>{label}</span>
      <span className="text-white/82 text-[13px] font-semibold flex-1 text-right leading-snug">{value}</span>
    </div>
  );
};

// ─── بلوك قسم ─────────────────────────────
const Block = ({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode
}) => {
  const flat = Array.isArray(children) ? (children as any[]).flat().filter(Boolean) : [children].filter(Boolean);
  if (!flat.length) return null;
  return (
    <div className="mb-3 rounded-[26px] overflow-hidden" style={{
      background: 'rgba(255,255,255,0.032)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      border: '1px solid rgba(255,255,255,0.065)',
      boxShadow: '0 4px 28px rgba(0,0,0,0.32)',
    }}>
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-white/[0.045]">
        <span className="text-[#A4161A]/65">{icon}</span>
        <span className="text-white/32 text-[9px] font-black tracking-[0.22em] uppercase">{title}</span>
      </div>
      <div className="px-4 py-0.5">{flat}</div>
    </div>
  );
};

// ─── شريط اكتمال ──────────────────────────
const CompletionBar = ({ pct }: { pct: number }) => {
  const col = pct >= 80 ? '#22c55e' : pct >= 50 ? '#D4AF37' : '#A4161A';
  return (
    <div className="mb-3 rounded-[26px] px-5 py-4 overflow-hidden" style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.055)',
    }}>
      <div className="flex justify-between items-center mb-2.5" dir="rtl">
        <span className="text-white/32 text-[11px] font-medium">اكتمال الملف الشخصي</span>
        <span className="font-black text-[13px]" style={{ color: col }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-white/[0.055]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${col}70, ${col})` }}
        />
      </div>
    </div>
  );
};

// ─── زر دائري زجاجي ───────────────────────
type BtnType = 'like' | 'pass' | 'message' | 'more';
interface GlassBtnProps {
  type: BtnType; size?: number;
  onClick?: () => void; disabled?: boolean; active?: boolean;
}

const GlassBtn = ({ type, size = 60, onClick, disabled, active }: GlassBtnProps) => {
  const [tap, setTap] = useState(false);
  const on = tap || active;

  const cfg: Record<BtnType, {
    icon: (on: boolean) => React.ReactNode;
    bg: [string, string]; glow: [string, string]; border: string;
  }> = {
    like: {
      icon: (o) => <Heart size={size * 0.38} fill={o ? 'white' : 'none'} className="text-white" strokeWidth={2} />,
      bg:   ['rgba(164,22,26,0.16)', 'rgba(164,22,26,0.52)'],
      glow: [
        '0 0 20px rgba(164,22,26,0.32), inset 0 1px 0 rgba(255,80,80,0.12)',
        '0 0 52px rgba(164,22,26,0.75), 0 0 90px rgba(164,22,26,0.3), inset 0 1px 0 rgba(255,120,120,0.28)',
      ],
      border: 'rgba(164,22,26,0.38)',
    },
    pass: {
      icon: () => <X size={size * 0.38} className="text-white/65" strokeWidth={2.5} />,
      bg:   ['rgba(255,255,255,0.065)', 'rgba(255,255,255,0.17)'],
      glow: [
        'inset 0 1px 0 rgba(255,255,255,0.07)',
        '0 0 30px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
      ],
      border: 'rgba(255,255,255,0.11)',
    },
    message: {
      icon: () => <MessageCircle size={size * 0.37} className="text-sky-300" strokeWidth={1.8} />,
      bg:   ['rgba(56,189,248,0.09)', 'rgba(56,189,248,0.28)'],
      glow: [
        '0 0 16px rgba(56,189,248,0.15), inset 0 1px 0 rgba(56,189,248,0.1)',
        '0 0 44px rgba(56,189,248,0.5), inset 0 1px 0 rgba(56,189,248,0.28)',
      ],
      border: 'rgba(56,189,248,0.18)',
    },
    more: {
      icon: () => <MoreHorizontal size={size * 0.38} className="text-white/45" />,
      bg:   ['rgba(255,255,255,0.045)', 'rgba(255,255,255,0.12)'],
      glow: [
        'inset 0 1px 0 rgba(255,255,255,0.06)',
        '0 0 22px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.14)',
      ],
      border: 'rgba(255,255,255,0.08)',
    },
  };

  const c = cfg[type];

  return (
    <motion.button
      onPointerDown={() => setTap(true)}
      onPointerUp={() => { setTap(false); onClick?.(); }}
      onPointerLeave={() => setTap(false)}
      disabled={disabled}
      whileTap={{ scale: 0.76 }}
      whileHover={{ scale: 1.07 }}
      transition={{ type: 'spring', stiffness: 480, damping: 20 }}
      className="flex items-center justify-center select-none outline-none flex-shrink-0"
      style={{
        width: size, height: size, borderRadius: '50%',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        background: on ? c.bg[1] : c.bg[0],
        boxShadow: on ? c.glow[1] : c.glow[0],
        border: `1.5px solid ${c.border}`,
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {c.icon(!!on)}
    </motion.button>
  );
};

// ─── Props ─────────────────────────────────
interface UserCardProps {
  userData: {
    id: string; name: string; age: number;
    city?: string; country?: string; gender?: string;
    job?: string; marital_status?: number; employment_type?: string;
    height?: number; weight?: number; skin_color?: string;
    bio?: string; mainPhoto: string; photos?: string[];
    prefersBlur?: boolean; subscription_type?: string;
    education_level?: number; financial_status?: string;
    religious_commitment?: number; quran_memorization?: string;
    housing_type?: number; preferred_housing?: string;
    health_status?: string; desire_for_children?: string;
    readiness_level?: number; partner_requirements?: string;
    marriage_type?: string; travel_willingness?: string;
    relationship_with_family?: string; social_type?: string;
    morning_evening?: string; conflict_style?: string;
    affection_style?: string; life_priority?: string;
    parenting_style?: string; home_time?: string;
    nationality?: string; has_children?: boolean;
    children_count?: number; children_custody?: string;
    profile_completion_percent?: number;
    beard_style?: string; prayer_commitment?: string;
    wife_number?: string; smoking?: string;
    hijab_style?: string; polygamy_acceptance?: string;
    work_after_marriage?: string;
    currentUser?: any;
  };
  onNext: () => void;
}

const NAV = 85;

// ══════════════════════════════════════════
export default function UserCard({ userData: u, onNext }: UserCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled,  setScrolled]  = useState(false);
  const [likeActive, setLikeActive] = useState(false);
  const [showMore,  setShowMore]  = useState(false);
  const [busy,      setBusy]      = useState(false);

  // سوايب motion values
  const x       = useMotionValue(0);
  const rotate  = useTransform(x, [-200, 200], [-14, 14]);
  const cardOp  = useTransform(x, [-260, -80, 0, 80, 260], [0, 1, 1, 1, 0]);
  const likeOp  = useTransform(x, [0, 85],  [0, 1]);
  const nopeOp  = useTransform(x, [-85, 0], [1, 0]);

  // بيانات مشتقة
  const isMale    = u.gender === 'male';
  const committed = COMMITTED_LEVELS.includes(u.religious_commitment ?? 0);
  const loc       = [u.country, u.city].filter(Boolean).join(' — ');
  const nat       = u.country && u.gender ? getNationality(u.country, u.gender as any) : (u.nationality ?? null);
  const edu       = u.education_level      ? getEducationLabel(u.education_level)                                   : null;
  const mar       = u.marital_status       ? getMaritalLabel(u.marital_status, isMale ? 'male' : 'female')          : null;
  const hou       = u.housing_type         ? getHousingLabel(u.housing_type)                                        : null;
  const rel       = u.religious_commitment ? getReligiousLabel(u.religious_commitment, isMale ? 'male' : 'female')  : null;
  const hw        = [u.height ? `${u.height} سم` : null, u.weight ? `${u.weight} كغ` : null].filter(Boolean).join(' · ') || null;
  const pct       = u.profile_completion_percent ?? 0;

  // تسجيل الفعل
  const act = useCallback(async (action: 'like' | 'pass' | 'message') => {
    if (busy || !u.currentUser) return;
    setBusy(true);
    try {
      if (action !== 'message') {
        await supabase.from('likes').insert({
          from_user: u.currentUser.id, to_user: u.id, action,
        });
      }
      const cost = action === 'like' ? C.LIKE_COST : action === 'message' ? C.MESSAGE_COST : C.SWIPE_RIGHT_COST;
      await supabase.rpc('deduct_points', {
        p_user_id: u.currentUser.id, p_amount: cost,
        p_desc: action === 'like' ? 'إعجاب' : action === 'message' ? 'فتح محادثة' : 'تجاهل',
      });
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  }, [busy, u]);

  const swipeTo = useCallback(async (dir: 1 | -1) => {
    await act(dir === 1 ? 'like' : 'pass');
    animate(x, dir * 700, { duration: 0.27 });
    setTimeout(() => { x.set(0); onNext(); }, 300);
  }, [act, x, onNext]);

  const onDragEnd = (_: any, info: any) => {
    if (info.offset.x > 105) {
      setLikeActive(true);
      setTimeout(() => setLikeActive(false), 450);
      swipeTo(1);
    } else if (info.offset.x < -105) {
      swipeTo(-1);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 360, damping: 28 });
    }
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) setScrolled(el.scrollTop > 55);
  };

  const onRelease = () => {
    const el = scrollRef.current;
    if (!el) return;
    const snap = window.innerHeight * 0.52;
    el.scrollTo({ top: el.scrollTop > snap * 0.38 ? snap : 0, behavior: 'smooth' });
  };

  // ═══════════════════════════════════════
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ paddingBottom: NAV }}>

      {/* ═══ بطاقة السوايب ═══ */}
      <motion.div
        style={{ x, rotate, opacity: cardOp }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.48}
        onDragEnd={onDragEnd}
        className="absolute inset-0"
      >
        {/* مؤشرات سوايب */}
        <motion.div style={{ opacity: likeOp }}
          className="absolute top-20 right-5 z-30 border-[2.5px] border-emerald-400 rounded-2xl px-4 py-1.5 rotate-[15deg] pointer-events-none">
          <p className="text-emerald-400 font-black text-lg tracking-wider">LIKE 💚</p>
        </motion.div>
        <motion.div style={{ opacity: nopeOp }}
          className="absolute top-20 left-5 z-30 border-[2.5px] border-rose-500 rounded-2xl px-4 py-1.5 -rotate-[15deg] pointer-events-none">
          <p className="text-rose-400 font-black text-lg tracking-wider">NOPE ✕</p>
        </motion.div>

        {/* ═══ صورة ═══ */}
        <div className="absolute inset-0">
          <img
            src={u.mainPhoto} alt={u.name} draggable={false}
            className={`w-full h-full object-cover select-none ${u.prefersBlur ? 'blur-2xl scale-110' : ''}`}
          />
          {/* gradient دائم */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 54%, transparent 100%)',
          }}/>
          {/* بريق primary */}
          <div className="absolute bottom-0 left-0 right-0 h-60 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(164,22,26,0.09) 0%, transparent 70%)',
          }}/>
        </div>

        {/* ═══ معلومات فوق الصورة ═══ */}
        <motion.div
          animate={{ opacity: scrolled ? 0 : 1, y: scrolled ? 12 : 0 }}
          transition={{ duration: 0.22 }}
          className="absolute left-5 right-5 z-10 pointer-events-none"
          style={{ bottom: NAV + 108 }}
        >
          {/* ✅ الاسم + البادج */}
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap" dir="rtl">
            <h2 className="text-[1.85rem] font-black text-white leading-tight" style={{
              textShadow: '0 2px 16px rgba(0,0,0,0.6)',
            }}>
              {u.name}، {u.age}
            </h2>
            {u.subscription_type && (
              <AutoBadge value={u.subscription_type} isBroker={false} />
            )}
          </div>

          {/* موقع + مهنة */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3" dir="rtl">
            {u.city && (
              <span className="flex items-center gap-1.5 text-white/62 text-[13px]">
                {IC.pin} {u.city}
              </span>
            )}
            {u.job && (
              <span className="flex items-center gap-1.5 text-white/50 text-[13px]">
                {IC.brief} {u.job}
              </span>
            )}
          </div>

          {/* شريط اكتمال خفيف */}
          {pct > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${pct}%`,
                  background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#D4AF37' : '#A4161A',
                  opacity: 0.75,
                }}/>
              </div>
              <span className="text-white/42 text-[10.5px] font-bold flex-shrink-0">{pct}%</span>
            </div>
          )}
        </motion.div>

        {/* ═══ اللوحة المنزلقة ═══ */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          onTouchEnd={onRelease}
          onMouseUp={onRelease}
          className="absolute inset-0 overflow-y-scroll"
          style={{ scrollbarWidth: 'none', paddingTop: '52vh' }}
        >
          <style>{`div::-webkit-scrollbar{display:none}`}</style>

          <div className="rounded-t-[34px] overflow-hidden" style={{
            background: 'rgba(7,5,13,0.97)',
            backdropFilter: 'blur(55px)',
            WebkitBackdropFilter: 'blur(55px)',
            border: '1px solid rgba(255,255,255,0.055)',
            borderBottom: 'none',
            boxShadow: '0 -10px 50px rgba(0,0,0,0.65)',
            minHeight: '52vh',
          }}>
            {/* مقبض */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-[3.5px] rounded-full bg-white/14"/>
            </div>

            {/* ═══ Sticky header ═══ */}
            <AnimatePresence>
              {scrolled && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1,  y: 0   }}
                  exit={{    opacity: 0,  y: -10  }}
                  transition={{ duration: 0.2 }}
                  className="sticky top-0 z-20 px-5 py-3 flex items-center justify-between gap-3"
                  style={{
                    background: 'rgba(7,5,13,0.98)',
                    borderBottom: '1px solid rgba(255,255,255,0.045)',
                    backdropFilter: 'blur(30px)',
                  }}
                  dir="rtl"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* ✅ البادج في الـ sticky */}
                    <span className="text-white font-black text-[16.5px] truncate">{u.name}</span>
                    <span className="text-white/38 text-sm">{u.age}</span>
                    {u.subscription_type && (
                      <AutoBadge value={u.subscription_type} isBroker={false} />
                    )}
                  </div>
                  {/* شريط اكتمال مصغّر */}
                  {pct > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-[72px] h-[3px] rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#D4AF37' : '#A4161A',
                        }}/>
                      </div>
                      <span className="text-white/38 text-[10px] font-bold">{pct}%</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ البلوكات ═══ */}
            <div className="px-4 pt-4" style={{ paddingBottom: 28 }}>

              <Block title="البيانات الأساسية" icon={IC.users}>
                <Row icon={IC.heart}  label="الحالة المدنية"    value={mar} />
                <Row icon={IC.globe}  label="الجنسية"           value={nat} />
                <Row icon={IC.pin}    label="الإقامة"           value={loc} />
                <Row icon={IC.ruler}  label="الطول / الوزن"     value={hw} />
                <Row icon={IC.color}  label="لون البشرة"        value={u.skin_color} />
                <Row icon={IC.check}  label="جاهزية الزواج"     value={u.readiness_level === 81 ? '🟢 جاهز حالاً' : null} />
                <Row icon={IC.plane}  label="الانتقال"          value={u.travel_willingness} />
                <Row icon={IC.ring}   label="نوع الزواج"        value={u.marriage_type} />
              </Block>

              <Block title="الأطفال" icon={IC.child}>
                <Row icon={IC.child}  label="لديه أطفال"        value={u.has_children ? `نعم (${u.children_count ?? 0})` : 'لا'} />
                {u.has_children && <Row icon={IC.users} label="الحضانة"         value={u.children_custody} />}
                <Row icon={IC.heart}  label="رغبة بالإنجاب"     value={u.desire_for_children} />
              </Block>

              <Block title="المهنة والتعليم" icon={IC.brief}>
                <Row icon={IC.brief}  label="المهنة"             value={u.job} />
                <Row icon={IC.star}   label="نوع العمل"          value={u.employment_type} />
                <Row icon={IC.edu}    label="المستوى الدراسي"    value={edu} />
                <Row icon={IC.money}  label="الوضع المادي"       value={u.financial_status} />
              </Block>

              <Block title="السكن" icon={IC.home}>
                <Row icon={IC.home}   label="السكن الحالي"       value={hou} />
                <Row icon={IC.home}   label="بعد الزواج"         value={u.preferred_housing} />
              </Block>

              <Block title="الدين والالتزام" icon={IC.shield}>
                <Row icon={IC.shield} label="الالتزام"           value={rel} />
                <Row icon={IC.book}   label="حفظ القرآن"         value={u.quran_memorization} />
                {isMale && committed && <>
                  <Row icon={IC.users}  label="اللحية"           value={u.beard_style} />
                  <Row icon={IC.shield} label="صلاة الجماعة"     value={u.prayer_commitment} />
                </>}
                {!isMale && committed && (
                  <Row icon={IC.users} label="اللباس"            value={u.hijab_style} />
                )}
              </Block>

              <Block title="الصحة والعادات" icon={IC.pulse}>
                <Row icon={IC.pulse}  label="الحالة الصحية"      value={u.health_status} />
                {isMale && <Row icon={IC.smoke} label="التدخين"  value={u.smoking} />}
              </Block>

              <Block title="الطبع والشخصية" icon={IC.sun}>
                <Row icon={IC.users}  label="الشخصية"            value={u.social_type} />
                <Row icon={IC.sun}    label="صباحي / مسائي"      value={u.morning_evening} />
                <Row icon={IC.home}   label="وقت المنزل"         value={u.home_time} />
                <Row icon={IC.chat}   label="أسلوب الحوار"       value={u.conflict_style} />
                <Row icon={IC.heart}  label="التعبير العاطفي"    value={u.affection_style} />
                <Row icon={IC.users}  label="العلاقة بالأسرة"    value={u.relationship_with_family} />
                <Row icon={IC.star}   label="أولويات الحياة"     value={u.life_priority} />
                <Row icon={IC.child}  label="أسلوب التربية"      value={u.parenting_style} />
              </Block>

              {!isMale && (
                <Block title="الزواج" icon={IC.ring}>
                  <Row icon={IC.users} label="قبول التعدد"       value={u.polygamy_acceptance} />
                  <Row icon={IC.brief} label="العمل بعد الزواج"  value={u.work_after_marriage} />
                </Block>
              )}

              {/* نبذة شخصية */}
              {u.bio && (
                <div className="mb-3 rounded-[26px] overflow-hidden" style={{
                  background: 'rgba(164,22,26,0.055)',
                  border: '1px solid rgba(164,22,26,0.13)',
                }}>
                  <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-white/[0.04]">
                    <span className="text-[#A4161A]/60">{IC.chat}</span>
                    <span className="text-white/28 text-[9px] font-black tracking-[0.22em] uppercase">نبذة شخصية</span>
                  </div>
                  <p className="px-4 py-3 text-white/62 text-[13px] leading-[1.75]" dir="rtl">
                    &ldquo;{u.bio}&rdquo;
                  </p>
                </div>
              )}

              {/* يبحث عن */}
              {u.partner_requirements && (
                <div className="mb-3 rounded-[26px] overflow-hidden" style={{
                  background: 'rgba(120,60,240,0.055)',
                  border: '1px solid rgba(140,80,255,0.12)',
                }}>
                  <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-white/[0.04]">
                    <span className="text-purple-400/60">{IC.search}</span>
                    <span className="text-purple-400/55 text-[9px] font-black tracking-[0.22em] uppercase">يبحث عن</span>
                  </div>
                  <p className="px-4 py-3 text-white/58 text-[13px] leading-[1.75]" dir="rtl">
                    {u.partner_requirements}
                  </p>
                </div>
              )}

              {/* ✅ شريط الاكتمال الكامل */}
              {pct > 0 && <CompletionBar pct={pct} />}

            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ الأزرار الأربعة ═══ */}
      <AnimatePresence>
        {!scrolled && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 z-[180] flex items-center justify-center gap-5"
            style={{ bottom: NAV + 13 }}
          >
            {/* ترتيب من اليمين لليسار: Like / Message / Pass / More */}

            {/* 1. Like — الأكبر والأهم */}
            <GlassBtn type="like" size={72} disabled={busy} active={likeActive}
              onClick={() => {
                setLikeActive(true);
                setTimeout(() => setLikeActive(false), 480);
                swipeTo(1);
              }} />

            {/* 2. Message */}
            <GlassBtn type="message" size={58} disabled={busy}
              onClick={() => act('message')} />

            {/* 3. Pass */}
            <GlassBtn type="pass" size={58} disabled={busy}
              onClick={() => swipeTo(-1)} />

            {/* 4. More */}
            <GlassBtn type="more" size={46}
              onClick={() => setShowMore(v => !v)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ قائمة More ═══ */}
      <AnimatePresence>
        {showMore && (
          <>
            <div className="fixed inset-0 z-[190]" onClick={() => setShowMore(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1,   y: 0  }}
              exit={{    opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 440, damping: 26 }}
              className="fixed left-5 right-5 z-[200] rounded-[28px] overflow-hidden"
              style={{
                bottom: NAV + 88,
                background: 'rgba(9,7,16,0.97)',
                backdropFilter: 'blur(52px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 12px 70px rgba(0,0,0,0.75)',
              }}
            >
              {/* إبلاغ */}
              <motion.button
                whileTap={{ backgroundColor: 'rgba(239,68,68,0.1)', scale: 0.97 }}
                className="w-full flex items-center justify-center gap-3 py-4 border-b border-white/[0.045] active:bg-red-500/5 transition-colors"
                dir="rtl"
                onClick={async () => {
                  await supabase.from('reports').insert({
                    reporter_id: u.currentUser?.id,
                    reported_id: u.id,
                    reason: 'بلاغ من التطبيق',
                  });
                  setShowMore(false);
                }}
              >
                <Flag size={16} className="text-rose-400" />
                <span className="text-rose-400 font-bold text-[15px]">إبلاغ</span>
              </motion.button>

              {/* حظر */}
              <motion.button
                whileTap={{ backgroundColor: 'rgba(249,115,22,0.1)', scale: 0.97 }}
                className="w-full flex items-center justify-center gap-3 py-4 active:bg-orange-500/5 transition-colors"
                dir="rtl"
                onClick={() => setShowMore(false)}
              >
                <ShieldOff size={16} className="text-orange-400" />
                <span className="text-orange-400 font-bold text-[15px]">حظر</span>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}