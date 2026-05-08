'use client';
/**
 * app/mediators/page.tsx  (v2 — refactored)
 *
 * Pure presentation layer.
 * All business logic lives in hooks/useMediators.ts
 * All UI components live in components/mediators/
 *
 * This file is intentionally thin: layout, orchestration, state wiring.
 */

import { useState, useEffect }      from 'react';
import { motion, AnimatePresence }  from 'framer-motion';
import {
  Star, Users, MessageCircle, Flag,
  ChevronLeft, Crown, Send,
  X, Clock, Shield, UserX,
} from 'lucide-react';

import { LoveCoin }         from '@/components/ui/LoveCoin';
import { toast }            from 'sonner';

/* ── Feature components ─────────────────────────────── */
import { MediatorCard }    from '@/components/mediators/MediatorCard';
import { SubscribeSheet }  from '@/components/mediators/SubscribeSheet';
import { SuccessScreen }   from '@/components/mediators/SuccessScreen';
import { Stars }           from '@/components/mediators/Stars';

/* ── Hook + types ───────────────────────────────────── */
import { useMediators }    from '@/hooks/useMediators';
import type { MediatorRow, SuccessData } from '@/components/mediators/types';

/* ─────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────── */
export default function MediatorsPage() {
  const {
    mediators, loading,
    currentUser, balance,
    subscribers, subLoading,
    load, openMediator,
    submitRating, reportMediator,
    unsubscribe,
  } = useMediators();

  /* Sheet / overlay state — purely UI, belongs in page */
  const [selected,        setSelected]        = useState<MediatorRow | null>(null);
  const [subscribeTarget, setSubscribeTarget] = useState<MediatorRow | null>(null);
  const [successData,     setSuccessData]     = useState<SuccessData | null>(null);

  const [showRate,    setShowRate]    = useState(false);
  const [myRating,    setMyRating]    = useState(0);
  const [myComment,   setMyComment]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const [showReport,  setShowReport]  = useState(false);

  const [showUnsubscribe,    setShowUnsubscribe]    = useState(false);
  const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);

  useEffect(() => { load(); }, [load]);

  /* ── Handlers ─────────────────────────────────────── */
  const handleOpenDetail = async (m: MediatorRow) => {
    setSelected(m);
    setShowRate(false);
    setShowReport(false);
    setShowUnsubscribe(false);
    await openMediator(m);
  };

  const handleCloseDetail = () => {
    setSelected(null);
    setShowUnsubscribe(false);
  };

  const handleSubmitRating = async () => {
    if (!selected) return;
    setSubmitting(true);
    await submitRating(selected.id, myRating, myComment);
    setShowRate(false);
    setMyRating(0);
    setMyComment('');
    setSubmitting(false);
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
    if (ok) {
      setSelected(null);
      setShowUnsubscribe(false);
    }
  };

  /* ── Loading splash ───────────────────────────────── */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="text-5xl"
          aria-label="جاري التحميل"
        >
          🤝
        </motion.div>
      </div>
    );
  }

  /* ── Page ─────────────────────────────────────────── */
  return (
    <div
      className="min-h-full px-4 py-5 pb-28"
      dir="rtl"
      style={{ background: 'var(--bg-main)' }}
    >
      {/* Top bar */}
      {currentUser && (
        <div className="flex items-center justify-between mb-4 px-1">
          <h1
            className="font-black"
            style={{ fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}
          >
            الوسطاء
          </h1>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            aria-label={`رصيدك: ${balance.toLocaleString('ar-TN')} عملة`}
          >
            <span className="font-black" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
              {balance.toLocaleString('ar-TN')}
            </span>
            <LoveCoin size={16} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {mediators.length === 0 && (
        <div className="text-center py-24">
          <Crown size={40} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-bold" style={{ color: 'var(--text-tertiary)' }}>لا يوجد وسطاء</p>
        </div>
      )}

      {/* Mediator cards */}
      <div className="space-y-4">
        {mediators.map((m, i) => (
          <MediatorCard
            key={m.id}
            mediator={m}
            rank={i + 1}
            isAuthenticated={!!currentUser}
            onSubscribe={setSubscribeTarget}
            onOpenDetail={handleOpenDetail}
          />
        ))}
      </div>

      {/* ── Subscribe sheet ──────────────────────────── */}
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
              load();
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Success screen ───────────────────────────── */}
      <AnimatePresence>
        {successData && (
          <SuccessScreen
            data={successData}
            onClose={() => setSuccessData(null)}
          />
        )}
      </AnimatePresence>

      {/* ══ Detail bottom sheet ══════════════════════ */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300]"
              style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
              onClick={handleCloseDetail}
            />

            {/* Sheet */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`تفاصيل الوسيط ${selected.full_name}`}
              dir="rtl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[400] rounded-t-[32px] flex flex-col"
              style={{
                background: 'var(--bg-surface)',
                border:     '1px solid var(--glass-border)',
                maxHeight:  '88vh',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--glass-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full overflow-hidden"
                    style={{ border: '1.5px solid var(--border-gold)' }}
                  >
                    {selected.avatar_url ? (
                      <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'var(--bg-soft)' }}
                        aria-hidden
                      >🤝</div>
                    )}
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
                    <button
                      onClick={() => setShowRate((v) => !v)}
                      aria-label="تقييم الوسيط"
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
                    >
                      <Star size={14} style={{ color: '#D4AF37' }} />
                    </button>
                  )}
                  <button
                    onClick={() => setShowReport((v) => !v)}
                    aria-label="إبلاغ عن الوسيط"
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                  >
                    <Flag size={13} className="text-rose-400" />
                  </button>
                  <button
                    onClick={handleCloseDetail}
                    aria-label="إغلاق"
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                  >
                    <X size={15} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                {/* Rating form */}
                <AnimatePresence>
                  {showRate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-[20px] p-4 space-y-3"
                      style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}
                    >
                      <p className="font-black" style={{ fontSize: 'var(--text-sm)', color: '#D4AF37' }}>
                        قيّم الوسيط
                      </p>
                      <Stars value={myRating} size={28} interactive onChange={setMyRating} />
                      <textarea
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        placeholder="اكتب تعليقك..."
                        rows={2}
                        className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
                        style={{
                          background:  'var(--glass-bg)',
                          border:      '1px solid var(--glass-border)',
                          color:       'var(--text-main)',
                          fontFamily:  'inherit',
                          fontSize:    'var(--text-sm)',
                        }}
                      />
                      <button
                        onClick={handleSubmitRating}
                        disabled={submitting || myRating === 0}
                        className="w-full py-3 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #800020, var(--color-primary))',
                          opacity:    myRating === 0 ? 0.4 : 1,
                          fontSize:   'var(--text-sm)',
                        }}
                      >
                        <Send size={13} />
                        {submitting ? 'جاري...' : 'إرسال التقييم'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Report form */}
                <AnimatePresence>
                  {showReport && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-[20px] p-4"
                      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}
                    >
                      <p
                        className="font-black mb-3"
                        style={{ fontSize: 'var(--text-sm)', color: '#f87171' }}
                      >
                        الإبلاغ عن الوسيط
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleReport}
                          className="flex-1 py-3 rounded-2xl font-black flex items-center justify-center gap-2"
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border:     '1px solid rgba(239,68,68,0.22)',
                            color:      '#f87171',
                            fontSize:   'var(--text-sm)',
                          }}
                        >
                          <Flag size={13} /> تأكيد البلاغ
                        </button>
                        <button
                          onClick={() => setShowReport(false)}
                          className="px-5 py-3 rounded-2xl font-bold"
                          style={{
                            background: 'var(--glass-bg)',
                            color:      'var(--text-tertiary)',
                            border:     '1px solid var(--glass-border)',
                            fontSize:   'var(--text-sm)',
                          }}
                        >
                          إلغاء
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bio */}
                {selected.bio && (
                  <div
                    className="rounded-[20px] p-4"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                  >
                    <p
                      className="font-black tracking-widest uppercase mb-2"
                      style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}
                    >
                      نبذة
                    </p>
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
                    <div className="flex justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-t-transparent rounded-full"
                        style={{ borderColor: 'var(--color-primary)' }}
                        aria-label="جاري تحميل المشتركين"
                      />
                    </div>
                  )}

                  {!subLoading && subscribers.length === 0 && (
                    <div className="text-center py-10">
                      <Users size={30} className="mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                        لا يوجد مشتركون بعد
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {subscribers.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 p-3 rounded-[18px]"
                        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                      >
                        <div className="w-11 h-11 rounded-[12px] overflow-hidden flex-shrink-0">
                          {s.avatar_url ? (
                            <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-lg"
                              style={{ background: 'var(--bg-soft)' }}
                              aria-hidden
                            >
                              {s.gender === 'female' ? '👩' : '👨'}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-black truncate" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                            {s.full_name || '—'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {s.city && (
                              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                                📍 {s.city}
                              </span>
                            )}
                            {s.age && (
                              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                                {s.age} سنة
                              </span>
                            )}
                          </div>

                          {s.profile_completion_percent > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div
                                className="flex-1 h-[3px] rounded-full overflow-hidden"
                                style={{ background: 'var(--glass-border)' }}
                                role="progressbar"
                                aria-valuenow={s.profile_completion_percent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`اكتمال الملف: ${s.profile_completion_percent}%`}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width:      `${s.profile_completion_percent}%`,
                                    background: s.profile_completion_percent >= 80
                                      ? '#22c55e'
                                      : s.profile_completion_percent >= 50
                                        ? '#D4AF37'
                                        : 'var(--color-primary)',
                                    transition: 'width 0.6s ease',
                                  }}
                                />
                              </div>
                              <span className="font-bold" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                                {s.profile_completion_percent}%
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          aria-label={`عرض ملف ${s.full_name}`}
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                        >
                          <ChevronLeft size={14} style={{ color: 'var(--text-tertiary)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid var(--glass-border)' }}>

                {/* Unsubscribe confirm panel */}
                <AnimatePresence>
                  {showUnsubscribe && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pt-4"
                    >
                      <div
                        className="rounded-[20px] p-4 mb-3"
                        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <UserX size={15} style={{ color: '#f87171' }} />
                          <p className="font-black" style={{ fontSize: 'var(--text-sm)', color: '#f87171' }}>
                            تأكيد إلغاء الاشتراك
                          </p>
                        </div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 14 }}>
                          ستفقد الوصول إلى قائمة المشتركين وخدمات الوسيط.
                          لا يمكن استرداد العملات المدفوعة.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUnsubscribe}
                            disabled={unsubscribeLoading}
                            className="flex-1 py-3 rounded-2xl font-black flex items-center justify-center gap-2"
                            style={{
                              background: 'rgba(239,68,68,0.12)',
                              border:     '1px solid rgba(239,68,68,0.3)',
                              color:      '#f87171',
                              fontSize:   'var(--text-xs)',
                              opacity:    unsubscribeLoading ? 0.6 : 1,
                            }}
                          >
                            {unsubscribeLoading ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-t-transparent rounded-full border-red-400"
                              />
                            ) : (
                              <><UserX size={13} /> تأكيد الإلغاء</>
                            )}
                          </button>
                          <button
                            onClick={() => setShowUnsubscribe(false)}
                            disabled={unsubscribeLoading}
                            className="px-5 py-3 rounded-2xl font-bold"
                            style={{
                              background: 'var(--glass-bg)',
                              color:      'var(--text-tertiary)',
                              border:     '1px solid var(--glass-border)',
                              fontSize:   'var(--text-xs)',
                            }}
                          >
                            تراجع
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Primary footer buttons */}
                <div className="px-5 pb-8 pt-3 flex gap-2">
                  {selected.isSubscribed ? (
                    <div className="flex-[2] flex gap-2">
                      <div
                        className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-1.5 font-black"
                        style={{
                          background: 'rgba(212,175,55,0.1)',
                          border:     '1px solid var(--border-gold)',
                          fontSize:   'var(--text-xs)',
                          color:      '#D4AF37',
                        }}
                        role="status"
                      >
                        <Crown size={14} /> مشترك ✓
                      </div>
                      <button
                        onClick={() => setShowUnsubscribe((v) => !v)}
                        aria-label="إلغاء الاشتراك"
                        className="w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: showUnsubscribe ? 'rgba(239,68,68,0.12)' : 'var(--glass-bg)',
                          border:     showUnsubscribe ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--glass-border)',
                        }}
                      >
                        <UserX size={14} style={{ color: showUnsubscribe ? '#f87171' : 'var(--text-tertiary)' }} />
                      </button>
                    </div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setSelected(null); setSubscribeTarget(selected); }}
                      disabled={!currentUser}
                      className="flex-[2] py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #800020, var(--color-primary))',
                        boxShadow:  '0 8px 24px var(--shadow-red-glow)',
                        fontSize:   'var(--text-sm)',
                      }}
                    >
                      <Crown size={14} /> اشتراك الآن
                    </motion.button>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="flex-1 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(56,189,248,0.08)',
                      border:     '1px solid rgba(56,189,248,0.2)',
                      fontSize:   'var(--text-sm)',
                      color:      '#38BDF8',
                    }}
                  >
                    <MessageCircle size={14} /> رسالة
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