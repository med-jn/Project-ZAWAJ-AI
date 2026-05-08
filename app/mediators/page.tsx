'use client';
/**
 * app/mediators/page.tsx  (v3)
 * طبقة عرض نظيفة — كل الأيقونات SVG يدوي لتجاوز globals.css fill:none
 * الـ padding-bottom محسوب من --nav-h-safe
 */

import { useState, useEffect }     from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { LoveCoin }        from '@/components/ui/LoveCoin';
import { toast }           from 'sonner';

import { MediatorCard }    from '@/components/mediators/MediatorCard';
import { SubscribeSheet }  from '@/components/mediators/SubscribeSheet';
import { SuccessScreen }   from '@/components/mediators/SuccessScreen';
import { Stars }           from '@/components/mediators/Stars';

import { useMediators }    from '@/hooks/useMediators';
import type { MediatorRow, Subscriber, SuccessData } from '@/components/mediators/types';

/* ── SVG icons — يتجاوزون fill:none من globals.css ── */
function StarIcon({ size = 14, color = '#D4AF37' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        style={{ fill: color, stroke: color, strokeWidth: '1px', strokeLinejoin: 'round' }} />
    </svg>
  );
}

function FlagIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
        style={{ fill: 'rgba(239,68,68,0.15)', stroke: '#f87171', strokeWidth: '2px', strokeLinejoin: 'round' }} />
      <line x1="4" y1="22" x2="4" y2="15"
        style={{ fill: 'none', stroke: '#f87171', strokeWidth: '2px', strokeLinecap: 'round' }} />
    </svg>
  );
}

function XIcon({ size = 15, color = 'var(--text-tertiary)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <line x1="18" y1="6" x2="6" y2="18" style={{ stroke: color, strokeWidth: '2px', strokeLinecap: 'round' }} />
      <line x1="6" y1="6" x2="18" y2="18" style={{ stroke: color, strokeWidth: '2px', strokeLinecap: 'round' }} />
    </svg>
  );
}

function UsersIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        style={{ fill: 'none', stroke: 'var(--text-tertiary)', strokeWidth: '2px', strokeLinecap: 'round' }} />
      <circle cx="9" cy="7" r="4"
        style={{ fill: 'none', stroke: 'var(--text-tertiary)', strokeWidth: '2px' }} />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        style={{ fill: 'none', stroke: 'var(--text-tertiary)', strokeWidth: '2px', strokeLinecap: 'round' }} />
    </svg>
  );
}

function ChevronLeftIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <polyline points="15 18 9 12 15 6"
        style={{ fill: 'none', stroke: 'var(--text-tertiary)', strokeWidth: '2px', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
    </svg>
  );
}

function MessageIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        style={{ fill: 'rgba(56,189,248,0.12)', stroke: '#38BDF8', strokeWidth: '2px', strokeLinejoin: 'round' }} />
    </svg>
  );
}

function SendIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <line x1="22" y1="2" x2="11" y2="13"
        style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '2px', strokeLinecap: 'round' }} />
      <polygon points="22 2 15 22 11 13 2 9 22 2"
        style={{ fill: 'rgba(255,255,255,0.15)', stroke: 'currentColor', strokeWidth: '2px', strokeLinejoin: 'round' }} />
    </svg>
  );
}

function UserXIcon({ size = 15, color = '#f87171' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        style={{ fill: 'none', stroke: color, strokeWidth: '2px', strokeLinecap: 'round' }} />
      <circle cx="8.5" cy="7" r="4"
        style={{ fill: 'none', stroke: color, strokeWidth: '2px' }} />
      <line x1="18" y1="8" x2="23" y2="13"
        style={{ fill: 'none', stroke: color, strokeWidth: '2px', strokeLinecap: 'round' }} />
      <line x1="23" y1="8" x2="18" y2="13"
        style={{ fill: 'none', stroke: color, strokeWidth: '2px', strokeLinecap: 'round' }} />
    </svg>
  );
}

function CrownIcon({ size = 40, color = 'var(--text-tertiary)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <path d="M2 20h20M5 20V10l7-7 7 7v10"
        style={{ fill: 'none', stroke: color, strokeWidth: '2px', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
    </svg>
  );
}

function SpinnerIcon({ size = 24, color = 'var(--color-primary)' }: { size?: number; color?: string }) {
  return (
    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
      style={{ display: 'inline-block', width: size, height: size,
        border: `2px solid rgba(255,255,255,0.15)`, borderTopColor: color, borderRadius: '50%' }} />
  );
}

/* ═══════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════ */
export default function MediatorsPage() {
  const {
    mediators, loading, currentUser, balance,
    subscribers, subLoading,
    load, openMediator, submitRating, reportMediator, unsubscribe,
  } = useMediators();

  const [selected,           setSelected]           = useState<MediatorRow | null>(null);
  const [subscribeTarget,    setSubscribeTarget]    = useState<MediatorRow | null>(null);
  const [successData,        setSuccessData]        = useState<SuccessData | null>(null);
  const [showRate,           setShowRate]           = useState(false);
  const [myRating,           setMyRating]           = useState(0);
  const [myComment,          setMyComment]          = useState('');
  const [submitting,         setSubmitting]         = useState(false);
  const [showReport,         setShowReport]         = useState(false);
  const [showUnsubscribe,    setShowUnsubscribe]    = useState(false);
  const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);

  useEffect(() => { load(); }, [load]);

  const handleOpenDetail = async (m: MediatorRow) => {
    setSelected(m); setShowRate(false); setShowReport(false); setShowUnsubscribe(false);
    await openMediator(m);
  };
  const handleCloseDetail = () => { setSelected(null); setShowUnsubscribe(false); };

  const handleSubmitRating = async () => {
    if (!selected) return;
    setSubmitting(true);
    await submitRating(selected.id, myRating, myComment);
    setShowRate(false); setMyRating(0); setMyComment(''); setSubmitting(false);
  };

  const handleReport = async () => {
    if (!selected) return;
    await reportMediator(selected.id);
    setShowReport(false);
  };

  const handleUnsubscribe = async () => {
    if (!selected) return;
    setUnsubscribeLoading(true);
    const ok = await unsubscribe(selected);
    setUnsubscribeLoading(false);
    if (ok) { setSelected(null); setShowUnsubscribe(false); }
  };

  /* Loading */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
          className="text-5xl" aria-label="جاري التحميل">🤝</motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 py-5" dir="rtl" style={{ background: 'var(--bg-main)' }}>

      {/* Top bar */}
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

      {/* Empty */}
      {mediators.length === 0 && (
        <div className="text-center py-24">
          <div className="flex justify-center mb-3"><CrownIcon /></div>
          <p className="font-bold" style={{ color: 'var(--text-tertiary)' }}>لا يوجد وسطاء</p>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-4">
        {mediators.map((m, i) => (
          <MediatorCard key={m.id} mediator={m} rank={i + 1}
            isAuthenticated={!!currentUser}
            onSubscribe={setSubscribeTarget}
            onOpenDetail={handleOpenDetail}
          />
        ))}
      </div>

      {/* Subscribe sheet */}
      <AnimatePresence>
        {subscribeTarget && !successData && (
          <SubscribeSheet
            mediator={subscribeTarget} balance={balance}
            userName={currentUser?.full_name ?? 'مستخدم'}
            onClose={() => setSubscribeTarget(null)}
            onSuccess={(d) => { setSubscribeTarget(null); setSuccessData(d); load(); }}
          />
        )}
      </AnimatePresence>

      {/* Success screen */}
      <AnimatePresence>
        {successData && <SuccessScreen data={successData} onClose={() => setSuccessData(null)} />}
      </AnimatePresence>

      {/* ══ Detail sheet ══ */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300]"
              style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
              onClick={handleCloseDetail} />

            <motion.div role="dialog" aria-modal="true"
              aria-label={`تفاصيل الوسيط ${selected.full_name}`} dir="rtl"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[400] rounded-t-[32px] flex flex-col"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', maxHeight: '88vh' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden"
                    style={{ border: '1.5px solid var(--border-gold)' }}>
                    {selected.avatar_url
                      ? <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"
                          style={{ background: 'var(--bg-soft)' }} aria-hidden>🤝</div>}
                  </div>
                  <div>
                    <p className="font-black" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                      {selected.full_name}
                    </p>
                    <Stars value={selected.avg_rating} size={11} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser?.mediator_id === selected.id && (
                    <button onClick={() => setShowRate(v => !v)} aria-label="تقييم الوسيط"
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <StarIcon size={14} />
                    </button>
                  )}
                  <button onClick={() => setShowReport(v => !v)} aria-label="إبلاغ"
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                    <FlagIcon />
                  </button>
                  <button onClick={handleCloseDetail} aria-label="إغلاق"
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                    <XIcon />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                {/* Rating form */}
                <AnimatePresence>
                  {showRate && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-[20px] p-4 space-y-3"
                      style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <p className="font-black" style={{ fontSize: 'var(--text-sm)', color: '#D4AF37' }}>قيّم الوسيط</p>
                      <Stars value={myRating} size={28} interactive onChange={setMyRating} />
                      <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
                        placeholder="اكتب تعليقك..." rows={2}
                        className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
                        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                          color: 'var(--text-main)', fontFamily: 'inherit', fontSize: 'var(--text-sm)' }} />
                      <button onClick={handleSubmitRating} disabled={submitting || myRating === 0}
                        className="w-full py-3 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #800020, var(--color-primary))',
                          opacity: myRating === 0 ? 0.4 : 1, fontSize: 'var(--text-sm)' }}>
                        <SendIcon /> {submitting ? 'جاري...' : 'إرسال التقييم'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Report form */}
                <AnimatePresence>
                  {showReport && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="rounded-[20px] p-4"
                      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                      <p className="font-black mb-3" style={{ fontSize: 'var(--text-sm)', color: '#f87171' }}>
                        الإبلاغ عن الوسيط
                      </p>
                      <div className="flex gap-2">
                        <button onClick={handleReport}
                          className="flex-1 py-3 rounded-2xl font-black flex items-center justify-center gap-2"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)',
                            color: '#f87171', fontSize: 'var(--text-sm)' }}>
                          <FlagIcon /> تأكيد البلاغ
                        </button>
                        <button onClick={() => setShowReport(false)} className="px-5 py-3 rounded-2xl font-bold"
                          style={{ background: 'var(--glass-bg)', color: 'var(--text-tertiary)',
                            border: '1px solid var(--glass-border)', fontSize: 'var(--text-sm)' }}>
                          إلغاء
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bio */}
                {selected.bio && (
                  <div className="rounded-[20px] p-4"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                    <p className="font-black tracking-widest uppercase mb-2"
                      style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>نبذة</p>
                    <p style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-secondary)' }}>
                      {selected.bio}
                    </p>
                  </div>
                )}

                {/* Subscribers */}
                <div>
                  <p className="font-black mb-3" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                    المشتركون ({currentUser?.gender === 'male' ? 'الإناث' : 'الذكور'})
                  </p>
                  {subLoading && (
                    <div className="flex justify-center py-8"><SpinnerIcon /></div>
                  )}
                  {!subLoading && subscribers.length === 0 && (
                    <div className="text-center py-10">
                      <div className="flex justify-center mb-2"><UsersIcon /></div>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>لا يوجد مشتركون بعد</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {subscribers.map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-[18px]"
                        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                        <div className="w-11 h-11 rounded-[12px] overflow-hidden flex-shrink-0">
                          {s.avatar_url
                            ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg"
                                style={{ background: 'var(--bg-soft)' }} aria-hidden>
                                {s.gender === 'female' ? '👩' : '👨'}
                              </div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black truncate" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                            {s.full_name || '—'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {s.city && <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>📍 {s.city}</span>}
                            {s.age  && <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{s.age} سنة</span>}
                          </div>
                          {s.profile_completion_percent > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-[3px] rounded-full overflow-hidden"
                                style={{ background: 'var(--glass-border)' }}
                                role="progressbar" aria-valuenow={s.profile_completion_percent}
                                aria-valuemin={0} aria-valuemax={100}>
                                <div className="h-full rounded-full"
                                  style={{
                                    width: `${s.profile_completion_percent}%`,
                                    background: s.profile_completion_percent >= 80 ? '#22c55e'
                                      : s.profile_completion_percent >= 50 ? '#D4AF37' : 'var(--color-primary)',
                                    transition: 'width 0.6s ease',
                                  }} />
                              </div>
                              <span className="font-bold" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                                {s.profile_completion_percent}%
                              </span>
                            </div>
                          )}
                        </div>
                        <button aria-label={`عرض ملف ${s.full_name}`}
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                          <ChevronLeftIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid var(--glass-border)' }}>

                {/* Unsubscribe panel */}
                <AnimatePresence>
                  {showUnsubscribe && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="px-5 pt-4">
                      <div className="rounded-[20px] p-4 mb-3"
                        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <UserXIcon />
                          <p className="font-black" style={{ fontSize: 'var(--text-sm)', color: '#f87171' }}>
                            تأكيد إلغاء الاشتراك
                          </p>
                        </div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 14 }}>
                          ستفقد الوصول إلى قائمة المشتركين وخدمات الوسيط. لا يمكن استرداد العملات المدفوعة.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={handleUnsubscribe} disabled={unsubscribeLoading}
                            className="flex-1 py-3 rounded-2xl font-black flex items-center justify-center gap-2"
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                              color: '#f87171', fontSize: 'var(--text-xs)', opacity: unsubscribeLoading ? 0.6 : 1 }}>
                            {unsubscribeLoading
                              ? <SpinnerIcon size={16} color="#f87171" />
                              : <><UserXIcon size={13} /> تأكيد الإلغاء</>}
                          </button>
                          <button onClick={() => setShowUnsubscribe(false)} disabled={unsubscribeLoading}
                            className="px-5 py-3 rounded-2xl font-bold"
                            style={{ background: 'var(--glass-bg)', color: 'var(--text-tertiary)',
                              border: '1px solid var(--glass-border)', fontSize: 'var(--text-xs)' }}>
                            تراجع
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Primary buttons */}
                <div className="px-5 pb-6 pt-3 flex gap-2">
                  {selected.isSubscribed ? (
                    <div className="flex-[2] flex gap-2">
                      <div className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-1.5 font-black"
                        style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid var(--border-gold)',
                          fontSize: 'var(--text-xs)', color: '#D4AF37' }} role="status">
                        👑 مشترك ✓
                      </div>
                      <button onClick={() => setShowUnsubscribe(v => !v)} aria-label="إلغاء الاشتراك"
                        className="w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: showUnsubscribe ? 'rgba(239,68,68,0.12)' : 'var(--glass-bg)',
                          border: showUnsubscribe ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--glass-border)' }}>
                        <UserXIcon size={14} color={showUnsubscribe ? '#f87171' : 'var(--text-tertiary)'} />
                      </button>
                    </div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => { setSelected(null); setSubscribeTarget(selected); }}
                      disabled={!currentUser}
                      className="flex-[2] py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #800020, var(--color-primary))',
                        boxShadow: '0 8px 24px var(--shadow-red-glow)', fontSize: 'var(--text-sm)' }}>
                      👑 اشتراك الآن
                    </motion.button>
                  )}

                  <motion.button whileTap={{ scale: 0.9 }}
                    className="flex-1 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2"
                    style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                      fontSize: 'var(--text-sm)', color: '#38BDF8' }}>
                    <MessageIcon /> رسالة
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}