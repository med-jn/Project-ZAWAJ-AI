'use client';
/**
 * 📁 app/mediators/page.tsx
 * ✅ يستخدم get_mediators() RPC
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Users, MessageCircle, Gift, Flag,
  MapPin, ChevronLeft, X, Heart, Crown, Send, Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

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

export default function MediatorsPage() {
  const [mediators,   setMediators]   = useState<MediatorRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selected,    setSelected]    = useState<MediatorRow | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subLoading,  setSubLoading]  = useState(false);
  const [showRate,    setShowRate]    = useState(false);
  const [myRating,    setMyRating]    = useState(0);
  const [myComment,   setMyComment]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [showReport,  setShowReport]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    // المستخدم الحالي
    const { data: { user } } = await supabase.auth.getUser();
    let myProfile: any = null;
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('id, gender, mediator_id')
        .eq('id', user.id)
        .single();
      myProfile = data;
    }
    setCurrentUser(myProfile);

    // ✅ RPC مباشر
    const { data, error } = await supabase.rpc('get_mediators');

    if (error) {
      console.error('[Mediators] rpc error:', error.message);
      setLoading(false);
      return;
    }

    const rows: MediatorRow[] = (data ?? []).map((m: any) => ({
      ...m,
      avg_rating:  Number(m.avg_rating ?? 0),
      isSubscribed: myProfile?.mediator_id === m.id,
    }));

    rows.sort((a, b) => b.avg_rating - a.avg_rating);
    setMediators(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openMediator = async (m: MediatorRow) => {
    setSelected(m);
    setShowRate(false);
    setShowReport(false);
    setSubLoading(true);
    const oppGender = currentUser?.gender === 'male' ? 'female' : 'male';
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, age, city, gender, profile_completion_percent')
      .eq('mediator_id', m.id)
      .eq('gender', oppGender);
    setSubscribers(data ?? []);
    setSubLoading(false);
  };

  const subscribe = async (m: MediatorRow) => {
    if (!currentUser || m.isSubscribed) return;
    if (currentUser.mediator_id) {
      await supabase.from('mediator_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', currentUser.id)
        .eq('mediator_id', currentUser.mediator_id);
    }
    await supabase.from('mediator_subscriptions').insert({
      id: currentUser.id, mediator_id: m.id, tier: 'basic', status: 'active',
    });
    await supabase.from('profiles').update({ mediator_id: m.id }).eq('id', currentUser.id);
    load();
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
  };

  // ══════════════════════════════════════
  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-5xl">🤝</motion.div>
    </div>
  );

  return (
    <div className="min-h-full px-4 py-5" dir="rtl" style={{ background: 'var(--bg-main)' }}>

      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-main)' }}>الوسطاء</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          اختر وسيطاً موثوقاً يساعدك في رحلة الزواج
        </p>
      </div>

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
                        style={{ background: 'var(--bg-soft)' }}>🤝</div>
                  }
                </div>
                {i < 3 && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{ background: i===0?'#D4AF37':i===1?'#C0C0C0':'#CD7F32', color:'#000' }}>
                    {i+1}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base" style={{ color: 'var(--text-main)' }}>{m.full_name}</h3>
                  <LevelBadge level={m.mediator_level} />
                </div>
                {m.city && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={11} style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {m.city}{m.country ? `، ${m.country}` : ''}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Stars value={m.avg_rating} size={12} />
                  <span className="text-xs font-bold" style={{ color: 'var(--color-gold)' }}>
                    {m.avg_rating.toFixed(1)}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
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
                  <p className="font-black text-base" style={{ color:s.color }}>{s.val}</p>
                  <p className="text-[10px] font-bold" style={{ color:`${s.color}80` }}>{s.label}</p>
                </div>
              ))}
            </div>

            {m.bio && (
              <p className="mt-3 text-[12.5px] leading-relaxed line-clamp-2"
                style={{ color:'var(--text-secondary)' }}>{m.bio}</p>
            )}

            {/* أزرار */}
            <div className="flex gap-2 mt-4">
              <motion.button whileTap={{ scale:0.95 }}
                onClick={() => subscribe(m)}
                disabled={m.isSubscribed || !currentUser}
                className="flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                style={{
                  background: m.isSubscribed?'var(--color-gold)':'linear-gradient(135deg,#800020,#c0002a)',
                  color: m.isSubscribed?'black':'white',
                  border: m.isSubscribed?'1px solid rgba(34,197,94,0.25)':'none',
                  boxShadow: m.isSubscribed?'none':'0 6px 20px rgba(192,0,42,0.3)',
                }}>
                {m.isSubscribed ? <><Crown size={18}/></> : <><Crown size={14}/> اشتراك</>}
              </motion.button>

              <motion.button whileTap={{scale:0.9}}
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.2)' }}>
                <MessageCircle size={17} style={{ color:'#38BDF8' }} />
              </motion.button>

              <motion.button whileTap={{scale:0.9}}
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.2)' }}>
                <Gift size={17} style={{ color:'#D4AF37' }} />
              </motion.button>

              <motion.button whileTap={{scale:0.9}}
                onClick={() => openMediator(m)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
                <ChevronLeft size={17} style={{ color:'var(--text-tertiary)' }} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

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
              {/* هيدر الـ Sheet */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom:'1px solid var(--glass-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[13px] overflow-hidden"
                    style={{ border:'1.5px solid var(--border-gold)' }}>
                    {selected.avatar_url
                      ? <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ background:'var(--bg-soft)' }}>🤝</div>
                    }
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{ color:'var(--text-main)' }}>{selected.full_name}</p>
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
                      <p className="font-black text-sm" style={{ color:'var(--color-gold)' }}>قيّم الوسيط</p>
                      <Stars value={myRating} size={28} interactive onChange={setMyRating} />
                      <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
                        placeholder="اكتب تعليقك..." rows={2}
                        className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                        style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                          color:'var(--text-main)', fontFamily:'inherit' }} />
                      <button onClick={submitRating} disabled={submitting || myRating===0}
                        className="w-full py-3 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2"
                        style={{ background:'linear-gradient(135deg,#800020,#c0002a)', opacity:myRating===0?0.4:1 }}>
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
                      <p className="font-black text-sm text-rose-400 mb-3">الإبلاغ عن الوسيط</p>
                      <div className="flex gap-2">
                        <button onClick={reportMediator}
                          className="flex-1 py-3 rounded-2xl font-black text-sm text-rose-400 flex items-center justify-center gap-2"
                          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.22)' }}>
                          <Flag size={13}/> تأكيد البلاغ
                        </button>
                        <button onClick={() => setShowReport(false)}
                          className="px-5 py-3 rounded-2xl text-sm font-bold"
                          style={{ background:'var(--glass-bg)', color:'var(--text-tertiary)', border:'1px solid var(--glass-border)' }}>
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
                    <p className="text-sm leading-relaxed" style={{ color:'var(--text-secondary)' }}>{selected.bio}</p>
                  </div>
                )}

                {/* المشتركون */}
                <div>
                  <p className="font-black text-sm mb-3" style={{ color:'var(--text-main)' }}>
                    المشتركون ({currentUser?.gender==='male'?'الإناث':'الذكور'})
                  </p>
                  {subLoading && (
                    <div className="flex justify-center py-8">
                      <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:0.9,ease:'linear'}}
                        className="w-6 h-6 border-2 border-t-transparent rounded-full"
                        style={{ borderColor:'var(--color-accent)' }} />
                    </div>
                  )}
                  {!subLoading && subscribers.length===0 && (
                    <div className="text-center py-10">
                      <Users size={30} className="mx-auto mb-2" style={{ color:'var(--text-tertiary)' }} />
                      <p className="text-sm" style={{ color:'var(--text-tertiary)' }}>لا يوجد مشتركون بعد</p>
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
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm truncate" style={{ color:'var(--text-main)' }}>
                            {s.full_name||'—'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {s.city && <span className="text-[11px]" style={{ color:'var(--text-tertiary)' }}>📍 {s.city}</span>}
                            {s.age  && <span className="text-[11px]" style={{ color:'var(--text-tertiary)' }}>{s.age} سنة</span>}
                          </div>
                          {s.profile_completion_percent > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background:'var(--glass-border)' }}>
                                <div className="h-full rounded-full" style={{
                                  width:`${s.profile_completion_percent}%`,
                                  background: s.profile_completion_percent>=80?'#22c55e':s.profile_completion_percent>=50?'#D4AF37':'#c0002a',
                                }} />
                              </div>
                              <span className="text-[10px] font-bold" style={{ color:'var(--text-tertiary)' }}>
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

              {/* أزرار أسفل الـ Sheet */}
              <div className="px-5 pb-8 pt-3 flex gap-3"
                style={{ borderTop:'1px solid var(--glass-border)' }}>
                <button onClick={() => subscribe(selected)}
                  disabled={selected.isSubscribed || !currentUser}
                  className="flex-[2] py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                  style={{
                    background: selected.isSubscribed?'var(--color-gold)':'linear-gradient(135deg,#800020,#c0002a)',
                    color: selected.isSubscribed?'black':'white',
                    border: selected.isSubscribed?'1px solid rgba(34,197,94,0.25)':'none',
                  }}>
                  {selected.isSubscribed ? <><Crown size={18}/> أنت مشترك</> : <><Crown size={14}/> اشتراك الآن</>}
                </button>
                <button className="flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                  style={{ background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.2)', color:'#38BDF8' }}>
                  <MessageCircle size={14}/> رسالة
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}