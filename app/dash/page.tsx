'use client';
/**
 * 📁 app/dash/page.tsx
 * لوحة تحكم الوسيط — ZAWAJ AI
 * ✅ يستخدم full_name بدل first_name/last_name
 * ✅ مرتبط بالجداول الحقيقية
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Crown, Search, ChevronLeft,
  MapPin, Star, TrendingUp, Edit3, Save, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { COUNTRIES_CITIES } from '@/constants/countries';
import { getMediatorLevel } from '@/constants/constants';

interface Subscriber {
  id:                          string;
  full_name:                   string;
  avatar_url:                  string | null;
  gender:                      string;
  age:                         number | null;
  city:                        string | null;
  country:                     string | null;
  profile_completion_percent:  number;
  is_completed:                boolean;
}

interface Review {
  review_internal_id: string;
  id:                 string; // reviewer
  rating:             number;
  comment:            string | null;
  created_at:         string;
}

export default function MediatorDashPage() {
  const [loading,      setLoading]      = useState(true);
  const [mediator,     setMediator]     = useState<any>(null);
  const [activeTab,    setActiveTab]    = useState<'male' | 'female'>('male');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterCountry,setFilterCountry]= useState('');
  const [subscribers,  setSubscribers]  = useState<Subscriber[]>([]);
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [stats,        setStats]        = useState({ monthlySubs: 0, maleCount: 0, femaleCount: 0 });
  const [editBio,      setEditBio]      = useState(false);
  const [bioText,      setBioText]      = useState('');
  const [savingBio,    setSavingBio]    = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // بروفايل الوسيط
      const { data: med } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, city, country, success_count, mediator_level, role')
        .eq('id', user.id)
        .single();

      if (!med || med.role !== 'mediator') {
        setLoading(false);
        return;
      }

      setMediator(med);
      setBioText(med.bio ?? '');

      // المشتركون
      const { data: subs } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, gender, age, city, country, profile_completion_percent, is_completed')
        .eq('mediator_id', user.id);

      const subsArr = subs ?? [];
      setSubscribers(subsArr);

      // إحصائيات الشهر
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count } = await supabase
        .from('mediator_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('mediator_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      setStats({
        monthlySubs: count ?? 0,
        maleCount:   subsArr.filter(s => s.gender === 'male').length,
        femaleCount: subsArr.filter(s => s.gender === 'female').length,
      });

      // التقييمات
      const { data: revs } = await supabase
        .from('mediator_reviews')
        .select('*')
        .eq('mediator_id', user.id)
        .order('created_at', { ascending: false });

      setReviews(revs ?? []);
      setLoading(false);
    };

    fetchData();
  }, []);

  // متوسط التقييم
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  // تصفية المشتركين
  const filteredList = useMemo(() => {
    return subscribers.filter(s =>
      s.gender === activeTab
      && (s.full_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      && (!filterCountry || s.country === filterCountry)
    );
  }, [subscribers, activeTab, searchTerm, filterCountry]);

  const currentLevel = getMediatorLevel(stats.monthlySubs);

  // حفظ النبذة
  const saveBio = async () => {
    if (!mediator) return;
    setSavingBio(true);
    await supabase.from('profiles').update({ bio: bioText }).eq('id', mediator.id);
    setMediator((p: any) => ({ ...p, bio: bioText }));
    setSavingBio(false);
    setEditBio(false);
  };

  // ══════════════════════════════════════
  if (loading) return (
    <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-5xl">👑</motion.div>
    </div>
  );

  if (!mediator || mediator.role !== 'mediator') return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-8" dir="rtl"
      style={{ background: 'var(--bg-main)' }}>
      <Crown size={48} style={{ color: 'var(--text-tertiary)' }} />
      <p className="font-black text-xl text-center" style={{ color: 'var(--text-main)' }}>
        هذه الصفحة للوسطاء فقط
      </p>
      <p className="text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
        تواصل مع الإدارة لتفعيل حساب الوسيط
      </p>
    </div>
  );

  return (
    <div className="min-h-full pb-10 px-4 pt-2" dir="rtl" style={{ background: 'var(--bg-main)' }}>

      {/* ── هيدر الوسيط ── */}
      <div className="rounded-[28px] p-5 mb-5 relative overflow-hidden" style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-soft)',
      }}>
        <div className="flex items-start gap-4">
          {/* الصورة */}
          <div className="w-20 h-20 rounded-[18px] overflow-hidden flex-shrink-0" style={{
            border: '2px solid var(--border-gold)',
          }}>
            {mediator.avatar_url
              ? <img src={mediator.avatar_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: 'var(--bg-soft)' }}>👑</div>
            }
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black" style={{ color: 'var(--text-main)' }}>
                {mediator.full_name || 'الوسيط'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-xl text-xs font-black"
                style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>
                {currentLevel.badge} {currentLevel.name}
              </span>
            </div>

            {mediator.city && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={12} style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{mediator.city}</span>
              </div>
            )}

            {/* التقييم */}
            <div className="flex items-center gap-2 mt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13}
                  fill={avgRating > i ? '#D4AF37' : 'none'}
                  stroke={avgRating > i ? '#D4AF37' : 'rgba(255,255,255,0.2)'}
                />
              ))}
              <span className="text-xs font-bold" style={{ color: 'var(--color-gold)' }}>
                {avgRating.toFixed(1)} ({reviews.length})
              </span>
            </div>
          </div>
        </div>

        {/* النبذة + تعديلها */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>
              نبذتي
            </p>
            <button onClick={() => setEditBio(v => !v)}
              className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
              style={{ color: 'var(--color-accent)', background: 'rgba(164,22,26,0.1)' }}>
              {editBio ? <X size={11}/> : <Edit3 size={11}/>}
              {editBio ? 'إلغاء' : 'تعديل'}
            </button>
          </div>

          <AnimatePresence>
            {editBio ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <textarea
                  value={bioText}
                  onChange={e => setBioText(e.target.value)}
                  rows={3}
                  placeholder="اكتب نبذة تعريفية عنك..."
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                  style={{
                    background: 'var(--bg-soft)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)',
                    fontFamily: 'inherit',
                  }}
                />
                <motion.button whileTap={{ scale: 0.96 }} onClick={saveBio} disabled={savingBio}
                  className="mt-2 w-full py-2.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #800020, #c0002a)' }}>
                  <Save size={13}/> {savingBio ? 'جاري الحفظ...' : 'حفظ النبذة'}
                </motion.button>
              </motion.div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {mediator.bio || <span style={{ color: 'var(--text-tertiary)' }}>لم تكتب نبذة بعد...</span>}
              </p>
            )}
          </AnimatePresence>
        </div>

        {/* توهج */}
        <div className="absolute -left-8 -bottom-8 w-40 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12), transparent 70%)' }} />
      </div>

      {/* ── إحصائيات ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'ذكور',        value: stats.maleCount,   color: '#60A5FA', bg: 'rgba(59,130,246,0.08)'  },
          { label: 'إناث',        value: stats.femaleCount, color: '#F472B6', bg: 'rgba(236,72,153,0.08)'  },
          { label: 'نجاح الشهر',  value: mediator.success_count, color: '#4ADE80', bg: 'rgba(34,197,94,0.08)'   },
        ].map(s => (
          <div key={s.label} className="rounded-[20px] p-3 text-center" style={{
            background: s.bg, border: `1px solid ${s.color}30`,
          }}>
            <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: `${s.color}80` }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── التقييمات ── */}
      {reviews.length > 0 && (
        <div className="mb-5 rounded-[24px] p-4" style={{
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        }}>
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} style={{ color: 'var(--color-gold)' }} />
            <p className="font-black text-sm" style={{ color: 'var(--text-main)' }}>
              آراء المشتركين
            </p>
          </div>
          <div className="space-y-3">
            {reviews.slice(0, 3).map(r => (
              <div key={r.review_internal_id} className="flex items-start gap-3 pb-3"
                style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <div className="flex-shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={10}
                      fill={r.rating > i ? '#D4AF37' : 'none'}
                      stroke={r.rating > i ? '#D4AF37' : 'rgba(255,255,255,0.2)'}
                      className="inline"
                    />
                  ))}
                </div>
                {r.comment && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── البحث ── */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2" size={16}
            style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text" placeholder="البحث بالاسم..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl py-3 pr-11 text-sm outline-none"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-main)',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <select
          value={filterCountry}
          onChange={e => setFilterCountry(e.target.value)}
          className="rounded-2xl px-3 py-3 text-xs outline-none"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-main)',
            fontFamily: 'inherit',
          }}
        >
          <option value="">الكل</option>
          {Object.keys(COUNTRIES_CITIES).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* ── تبديل الجنس ── */}
      <div className="flex gap-2 mb-4 p-1.5 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
        {(['male', 'female'] as const).map(g => (
          <button key={g}
            onClick={() => setActiveTab(g)}
            className="flex-1 py-3 rounded-xl font-black text-sm transition-all"
            style={{
              background: activeTab === g ? (g === 'male' ? 'rgba(59,130,246,0.2)' : 'rgba(236,72,153,0.2)') : 'transparent',
              color: activeTab === g ? (g === 'male' ? '#60A5FA' : '#F472B6') : 'var(--text-tertiary)',
              border: activeTab === g ? `1px solid ${g === 'male' ? 'rgba(59,130,246,0.3)' : 'rgba(236,72,153,0.3)'}` : '1px solid transparent',
            }}
          >
            {g === 'male' ? `الذكور (${stats.maleCount})` : `الإناث (${stats.femaleCount})`}
          </button>
        ))}
      </div>

      {/* ── قائمة المشتركين ── */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredList.map((sub, i) => (
            <motion.div
              key={sub.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-[22px] p-4 flex items-center gap-4"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
              }}
            >
              {/* الصورة */}
              <div className="w-14 h-14 rounded-[14px] overflow-hidden flex-shrink-0"
                style={{ border: '1px solid var(--glass-border)' }}>
                {sub.avatar_url
                  ? <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl"
                      style={{ background: 'var(--bg-soft)' }}>
                      {sub.gender === 'female' ? '👩' : '👨'}
                    </div>
                }
              </div>

              {/* البيانات */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm truncate" style={{ color: 'var(--text-main)' }}>
                  {sub.full_name || '—'}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {sub.city && (
                    <span className="text-[11px] flex items-center gap-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      <MapPin size={9}/> {sub.city}
                    </span>
                  )}
                  {sub.age && (
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {sub.age} سنة
                    </span>
                  )}
                </div>
                {/* شريط الاكتمال */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${sub.profile_completion_percent}%`,
                      background: sub.profile_completion_percent >= 80 ? '#22c55e'
                        : sub.profile_completion_percent >= 50 ? '#D4AF37' : '#c0002a',
                    }}/>
                  </div>
                  <span className="text-[10px] font-bold flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                    {sub.profile_completion_percent}%
                  </span>
                </div>
              </div>

              {/* زر التفاصيل */}
              <button className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-soft)', border: '1px solid var(--glass-border)' }}>
                <ChevronLeft size={16} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredList.length === 0 && (
          <div className="text-center py-16">
            <Users size={36} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {searchTerm ? 'لا توجد نتائج' : 'لا يوجد مشتركون بعد'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}