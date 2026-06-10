'use client';
/**
 * app/mediators/page.tsx — ZAWAJ AI v3
 * ✅ قائمة المشتركين للمشتركين فقط
 * ✅ الضغط على بروفايل مشترك → /view?id=...
 * ✅ حظر الوسيط (نفس جدول blocks) مع dialog تأكيد
 * ✅ البلاغ عبر ReportSheet الموجود
 * ✅ تضبيب صور is_blurred
 */

import { useState, useEffect, useCallback }  from 'react';
import { motion, AnimatePresence }           from 'framer-motion';
import { useRouter }                         from 'next/navigation';
import {
  Star, Users, MessageCircle, Flag, ChevronLeft,
  Crown, Send, X, ShieldCheck, UserX, ShieldOff,
  Lock, ExternalLink,
} from 'lucide-react';
import { toast }                             from 'sonner';
import { supabase }                          from '@/lib/supabase/client';
import { MediatorCard }                      from '@/components/mediators/MediatorCard';
import { RequestMediationSheet }             from '@/components/mediators/RequestMediationSheet';
import { SuccessScreen }                     from '@/components/mediators/SuccessScreen';
import { Stars }                             from '@/components/mediators/Stars';
import { Icon }                              from '@/components/mediators/Icon';
import { LevelBadge }                        from '@/components/gems';
import { useMediators }                      from '@/hooks/useMediators';
import ReportSheet                           from '@/components/security/ReportSheet';
import type { MediatorRow, SuccessData }     from '@/components/mediators/types';

// ── Spinner ───────────────────────────────────────────────────
function Spinner({ size = 24 }: { size?: number }) {
  return (
    <motion.span animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
      style={{
        display: 'inline-block', width: size, height: size,
        border: '2px solid rgba(255,255,255,0.15)',
        borderTopColor: 'var(--color-primary)', borderRadius: '50%',
      }} />
  );
}

// ── Dialog تأكيد الحظر ────────────────────────────────────────
function BlockConfirmDialog({
  open, name, onConfirm, onCancel, loading,
}: {
  open: boolean; name: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 9999, width: 'min(88vw,310px)',
              background: 'var(--bg-elevated,#1a1a2e)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24, padding: '28px 22px 20px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
              direction: 'rtl',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(251,146,60,0.12)',
              border: '1px solid rgba(251,146,60,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <ShieldOff size={24} color="#fb923c" />
            </div>
            <p style={{ textAlign: 'center', margin: '0 0 6px', color: 'var(--text-main,#fff)', fontWeight: 800, fontSize: 16 }}>
              حظر {name}؟
            </p>
            <p style={{ textAlign: 'center', margin: '0 0 22px', color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>
              لن يتمكن من رؤيتك أو التواصل معك، وسيختفي من اقتراحاتك.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onCancel} disabled={loading} style={{
                flex: 1, padding: '12px 0', borderRadius: 13,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.65)',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                إلغاء
              </button>
              <motion.button whileTap={{ scale: 0.94 }} onClick={onConfirm} disabled={loading}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 13,
                  background: loading ? 'rgba(251,146,60,0.3)' : 'linear-gradient(145deg,#fb923c,#ea580c)',
                  border: 'none', color: '#fff', fontWeight: 800, fontSize: 14,
                  cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(251,146,60,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {loading
                  ? <Spinner size={15} />
                  : <><ShieldOff size={14} /> حظر</>
                }
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════
export default function MediatorsPage() {
  const router = useRouter();

  const {
    mediators, loading, currentUser,
    subscribers, subLoading, load, openMediator,
    submitRating, unsubscribe,
    markSubscribed, markUnsubscribed,
  } = useMediators();

  const [selected,           setSelected]           = useState<MediatorRow | null>(null);
  const [requestTarget,      setRequestTarget]      = useState<MediatorRow | null>(null);
  const [successData,        setSuccessData]        = useState<SuccessData | null>(null);
  const [showRate,           setShowRate]           = useState(false);
  const [myRating,           setMyRating]           = useState(0);
  const [myComment,          setMyComment]          = useState('');
  const [submitting,         setSubmitting]         = useState(false);
  const [showUnsubscribe,    setShowUnsubscribe]    = useState(false);
  const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);

  // حظر الوسيط
  const [blockDialog,        setBlockDialog]        = useState(false);
  const [blockLoading,       setBlockLoading]       = useState(false);
  const [isBlocked,          setIsBlocked]          = useState(false);

  // إبلاغ عبر ReportSheet
  const [reportOpen,         setReportOpen]         = useState(false);

  useEffect(() => { load(); }, [load]);

  // ── فتح التفاصيل ─────────────────────────────────────────
  const openDetail = async (m: MediatorRow) => {
    setSelected(m);
    setShowRate(false);
    setShowUnsubscribe(false);
    setIsBlocked(false);
    setBlockDialog(false);

    // فحص هل هو محظور مسبقاً
    if (currentUser) {
      const { data } = await supabase.from('blocks').select('id')
        .eq('blocker_id', currentUser.id).eq('blocked_id', m.id).maybeSingle();
      setIsBlocked(!!data);
    }

    await openMediator(m);
  };

  const closeDetail = () => {
    setSelected(null);
    setShowUnsubscribe(false);
    setBlockDialog(false);
  };

  // ── تقييم ────────────────────────────────────────────────
  const doRating = async () => {
    if (!selected) return;
    setSubmitting(true);
    await submitRating(selected.id, myRating, myComment);
    setShowRate(false); setMyRating(0); setMyComment('');
    setSubmitting(false);
  };

  // ── إلغاء الاشتراك ───────────────────────────────────────
  const doUnsubscribe = async () => {
    if (!selected) return;
    setUnsubscribeLoading(true);
    const ok = await unsubscribe(selected);
    setUnsubscribeLoading(false);
    if (ok) { setSelected(null); setShowUnsubscribe(false); }
  };

  // ── حظر الوسيط ───────────────────────────────────────────
  const doBlock = useCallback(async () => {
    if (!currentUser || !selected) return;
    setBlockLoading(true);
    try {
      await supabase.from('blocks').upsert(
        { blocker_id: currentUser.id, blocked_id: selected.id },
        { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
      );
      // حذف أي تفاعلات
      await Promise.all([
        supabase.from('likes').delete().eq('from_user', currentUser.id).eq('to_user', selected.id),
        supabase.from('likes').delete().eq('from_user', selected.id).eq('to_user', currentUser.id),
      ]);
      setIsBlocked(true);
      setBlockDialog(false);
      toast.success('تم حظر الوسيط');
      closeDetail();
    } catch {
      toast.error('حدث خطأ، حاول مجدداً');
    } finally {
      setBlockLoading(false);
    }
  }, [currentUser, selected]);

  // ── هل المستخدم مشترك عند الوسيط المحدد ─────────────────
  const amSubscribed = selected?.isSubscribed ?? false;

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
          <Icon i={Crown} size={48} color="var(--color-primary)" />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', padding: '20px 16px', direction: 'rtl', background: 'var(--bg-main)' }}>

      {/* ── Dialogs ────────────────────────────────────────── */}
      <BlockConfirmDialog
        open={blockDialog}
        name={selected?.full_name ?? 'هذا الوسيط'}
        onConfirm={doBlock}
        onCancel={() => setBlockDialog(false)}
        loading={blockLoading}
      />

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUserId={selected?.id ?? ''}
        targetType="mediator"
        targetId={selected?.id ?? null}
      />

      {/* ── Header ─────────────────────────────────────────── */}
      {currentUser && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
          <h1 style={{ fontWeight: 900, fontSize: 'var(--text-md)', color: 'var(--text-main)', margin: 0 }}>
            اختار وسيطك المناسب
          </h1>
        </div>
      )}

      {mediators.length === 0 && (
        <div style={{ textAlign: 'center', padding: '96px 0' }}>
          <Icon i={Crown} size={40} color="var(--text-tertiary)" />
          <p style={{ fontWeight: 700, color: 'var(--text-tertiary)', marginTop: 12 }}>لا يوجد وسطاء</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {mediators.map((m, i) => (
          <MediatorCard key={m.id} mediator={m} rank={i + 1}
            isAuthenticated={!!currentUser}
            onRequestMediation={setRequestTarget}
            onOpenDetail={openDetail} />
        ))}
      </div>

      {/* ── RequestMediationSheet ──────────────────────────── */}
      <AnimatePresence>
        {requestTarget && !successData && (
          <RequestMediationSheet
            mediator={requestTarget}
            userName={currentUser?.full_name ?? 'مستخدم'}
            onClose={() => setRequestTarget(null)}
            onSuccess={() => { setRequestTarget(null); load(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successData && <SuccessScreen data={successData} onClose={() => setSuccessData(null)} />}
      </AnimatePresence>

      {/* ══ Detail Sheet ══════════════════════════════════════ */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 300,
                background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
              }}
              onClick={closeDetail}
            />

            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                zIndex: 400, borderRadius: '32px 32px 0 0',
                display: 'flex', flexDirection: 'column',
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                maxHeight: '88vh',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--glass-border)' }} />
              </div>

              {/* ── Sheet Header ─────────────────────────────── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px 14px',
                borderBottom: '1px solid var(--glass-border)',
              }}>
                {/* معلومات الوسيط */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
                    border: '1.5px solid var(--border-gold,#D4AF37)', flexShrink: 0,
                  }}>
                    {selected.avatar_url
                      ? <img src={selected.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-soft)' }}>
                          <Icon i={Crown} size={22} color="var(--text-tertiary)" />
                        </div>
                    }
                  </div>
                  <div>
                    <p style={{ fontWeight: 900, fontSize: 'var(--text-sm)', color: 'var(--text-main)', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {selected.full_name}
                      <LevelBadge subscribers={selected.total_subscribers} size="sm" />
                    </p>
                    <Stars value={selected.avg_rating} size={11} />
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* تقييم (للمشتركين فقط) */}
                  {amSubscribed && (
                    <motion.button whileTap={{ scale: 0.88 }}
                      onClick={() => setShowRate(v => !v)}
                      style={{
                        width: 36, height: 36, borderRadius: 12,
                        border: '1px solid rgba(212,175,55,0.25)',
                        background: showRate ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon i={Star} size={14} color="#D4AF37" />
                    </motion.button>
                  )}

                  {/* إبلاغ */}
                  <motion.button whileTap={{ scale: 0.88 }}
                    onClick={() => setReportOpen(true)}
                    style={{
                      width: 36, height: 36, borderRadius: 12,
                      border: '1px solid rgba(239,68,68,0.2)',
                      background: 'rgba(239,68,68,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon i={Flag} size={13} color="#f87171" />
                  </motion.button>

                  {/* حظر */}
                  <motion.button whileTap={{ scale: 0.88 }}
                    onClick={() => !isBlocked && setBlockDialog(true)}
                    disabled={isBlocked}
                    title={isBlocked ? 'تم الحظر' : 'حظر الوسيط'}
                    style={{
                      width: 36, height: 36, borderRadius: 12,
                      border: isBlocked ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(251,146,60,0.25)',
                      background: isBlocked ? 'rgba(34,197,94,0.08)' : 'rgba(251,146,60,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: isBlocked ? 'default' : 'pointer',
                      opacity: isBlocked ? 0.7 : 1,
                    }}
                  >
                    {isBlocked
                      ? <ShieldCheck size={14} color="#22c55e" />
                      : <ShieldOff   size={14} color="#fb923c" />
                    }
                  </motion.button>

                  {/* إغلاق */}
                  <motion.button whileTap={{ scale: 0.88 }}
                    onClick={closeDetail}
                    style={{
                      width: 36, height: 36, borderRadius: 12,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon i={X} size={15} color="var(--text-tertiary)" />
                  </motion.button>
                </div>
              </div>

              {/* ── Sheet Body ───────────────────────────────── */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* فورم التقييم */}
                <AnimatePresence>
                  {showRate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        borderRadius: 20, padding: 16,
                        background: 'rgba(212,175,55,0.07)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        display: 'flex', flexDirection: 'column', gap: 10,
                      }}
                    >
                      <p style={{ fontWeight: 900, fontSize: 'var(--text-sm)', color: '#D4AF37', margin: 0 }}>قيّم الوسيط</p>
                      <Stars value={myRating} size={28} interactive onChange={setMyRating} />
                      <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
                        placeholder="اكتب تعليقك..." rows={2}
                        style={{
                          width: '100%', borderRadius: 16, padding: '10px 14px',
                          outline: 'none', resize: 'none',
                          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                          color: 'var(--text-main)', fontFamily: 'inherit', fontSize: 'var(--text-sm)',
                          boxSizing: 'border-box',
                        }} />
                      <button onClick={doRating} disabled={submitting || myRating === 0}
                        style={{
                          width: '100%', padding: '12px 0', borderRadius: 16,
                          background: 'linear-gradient(135deg,#800020,var(--color-primary))',
                          border: 'none', color: '#fff', fontWeight: 900,
                          fontSize: 'var(--text-sm)', cursor: myRating === 0 ? 'default' : 'pointer',
                          opacity: myRating === 0 ? 0.4 : 1, fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                        <Icon i={Send} size={13} color="#fff" />
                        {submitting ? 'جارٍ الإرسال...' : 'إرسال التقييم'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* نبذة */}
                {selected.bio && (
                  <div style={{
                    borderRadius: 20, padding: 16,
                    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>نبذة</p>
                    <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{selected.bio}</p>
                  </div>
                )}

                {/* ── قائمة المشتركين ─────────────────────── */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, direction: 'rtl' }}>
                    <Users size={15} color="var(--text-tertiary)" />
                    <p style={{ fontWeight: 900, fontSize: 'var(--text-sm)', color: 'var(--text-main)', margin: 0 }}>
                      الأعضاء ({currentUser?.gender === 'male' ? 'الإناث' : 'الذكور'})
                    </p>
                  </div>

                  {/* غير مشترك → رسالة قفل */}
                  {!amSubscribed ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        borderRadius: 20, padding: '24px 16px',
                        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 10,
                        textAlign: 'center', direction: 'rtl',
                      }}
                    >
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Lock size={22} color="var(--text-tertiary)" />
                      </div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                        متاح للمشتركين فقط
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                        اشترك مع هذا الوسيط لتتمكن من رؤية قائمة الأعضاء والتواصل معهم.
                      </p>
                    </motion.div>
                  ) : subLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                      <Spinner />
                    </div>
                  ) : subscribers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', direction: 'rtl' }}>
                      <Icon i={Users} size={30} color="var(--text-tertiary)" />
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 8 }}>لا يوجد أعضاء بعد</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {subscribers.map(s => (
                        <motion.div
                          key={s.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push(`/view?id=${s.id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', borderRadius: 18,
                            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                            cursor: 'pointer', direction: 'rtl',
                          }}
                        >
                          {/* صورة المشترك */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img
                              src={s.avatar_url || '/default-avatar.png'}
                              alt={s.full_name}
                              style={{
                                width: 44, height: 44, borderRadius: 12,
                                objectFit: 'cover',
                                border: '1px solid var(--glass-border)',
                                // تضبيب الصور التي اختار أصحابها الإخفاء
                                filter: (s as any).is_blurred ? 'blur(10px)' : 'none',
                                transform: (s as any).is_blurred ? 'scale(1.06)' : 'none',
                              }}
                            />
                          </div>

                          {/* المعلومات */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: '0 0 3px', fontWeight: 700,
                              fontSize: 'var(--text-sm)', color: 'var(--text-main)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {s.full_name || '—'}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {s.city && (
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.city}</span>
                              )}
                              {s.age && (
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.age} سنة</span>
                              )}
                            </div>
                            {s.profile_completion_percent > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                                <div style={{ flex: 1, height: 3, borderRadius: 99, overflow: 'hidden', background: 'var(--glass-border)' }}>
                                  <div style={{
                                    height: '100%', borderRadius: 99,
                                    width: `${s.profile_completion_percent}%`,
                                    background: s.profile_completion_percent >= 80 ? '#22c55e'
                                      : s.profile_completion_percent >= 50 ? '#D4AF37'
                                      : 'var(--color-primary)',
                                  }} />
                                </div>
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700 }}>
                                  {s.profile_completion_percent}%
                                </span>
                              </div>
                            )}
                          </div>

                          {/* سهم → صفحة الملف */}
                          <ExternalLink size={14} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Sheet Footer ─────────────────────────────── */}
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingBottom: 'var(--nav-h-safe,16px)' }}>

                {/* Unsubscribe panel */}
                <AnimatePresence>
                  {showUnsubscribe && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} style={{ padding: '14px 20px 0' }}>
                      <div style={{
                        borderRadius: 20, padding: 16, marginBottom: 12,
                        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Icon i={UserX} size={15} color="#f87171" />
                          <p style={{ fontWeight: 900, fontSize: 'var(--text-sm)', color: '#f87171', margin: 0 }}>
                            تأكيد إلغاء الوساطة
                          </p>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                          ستفقد الوصول إلى قائمة الأعضاء وخدمات الوسيط.
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={doUnsubscribe} disabled={unsubscribeLoading}
                            style={{
                              flex: 1, padding: '11px 0', borderRadius: 14,
                              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                              color: '#f87171', fontWeight: 900, fontSize: 12,
                              cursor: unsubscribeLoading ? 'default' : 'pointer',
                              fontFamily: 'inherit', opacity: unsubscribeLoading ? 0.6 : 1,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                            {unsubscribeLoading ? <Spinner size={15} /> : <><Icon i={UserX} size={13} color="#f87171" /> تأكيد الإلغاء</>}
                          </button>
                          <button onClick={() => setShowUnsubscribe(false)} disabled={unsubscribeLoading}
                            style={{
                              padding: '11px 18px', borderRadius: 14,
                              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                              color: 'var(--text-tertiary)', fontWeight: 700, fontSize: 12,
                              cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                            تراجع
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* الأزرار الرئيسية */}
                <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 8, direction: 'rtl' }}>
                  {amSubscribed ? (
                    <div style={{ flex: 2, display: 'flex', gap: 8 }}>
                      <div style={{
                        flex: 1, padding: '14px 0', borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
                        fontSize: 12, color: '#D4AF37', fontWeight: 900,
                      }}>
                        <Icon i={ShieldCheck} size={14} color="#D4AF37" /> بانتظار الوسيط ✓
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => setShowUnsubscribe(v => !v)}
                        style={{
                          width: 44, borderRadius: 16, flexShrink: 0,
                          background: showUnsubscribe ? 'rgba(239,68,68,0.12)' : 'var(--glass-bg)',
                          border: showUnsubscribe ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--glass-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}>
                        <Icon i={UserX} size={14} color={showUnsubscribe ? '#f87171' : 'var(--text-tertiary)'} />
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => { setSelected(null); setRequestTarget(selected); }}
                      disabled={!currentUser}
                      style={{
                        flex: 2, padding: '14px 0', borderRadius: 16,
                        background: 'linear-gradient(135deg,#800020,var(--color-primary))',
                        boxShadow: '0 8px 24px rgba(192,0,42,0.3)',
                        border: 'none', color: '#fff', fontWeight: 900,
                        fontSize: 'var(--text-sm)', cursor: currentUser ? 'pointer' : 'default',
                        fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      <Icon i={ShieldCheck} size={14} color="#fff" /> طلب وساطة
                    </motion.button>
                  )}

                  <motion.button whileTap={{ scale: 0.9 }}
                    style={{
                      flex: 1, padding: '14px 0', borderRadius: 16,
                      background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                      color: '#38BDF8', fontWeight: 900, fontSize: 'var(--text-sm)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                    <Icon i={MessageCircle} size={14} color="#38BDF8" /> رسالة
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