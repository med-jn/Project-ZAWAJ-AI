'use client';
/**
 * 📁 components/profile/ProfileActions.tsx — ZAWAJ AI v4
 *
 * ✅ مكون UI بحت — لا يحتوي على أي منطق أعمال
 * ✅ يفتح dialog تأكيد الحظر ثم يستدعي onBlock() فقط
 * ✅ المشاركة عبر Capacitor Share (ديب لينك)
 * ✅ تصميم ثلاثي الأبعاد موحد مع UserCard
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Share2, MoreVertical, ShieldOff, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Share } from '@capacitor/share';
import ReportSheet from '@/components/security/ReportSheet';

function playSound(name: 'like' | 'unlike' | 'message' | 'share') {
  try {
    const a = new Audio(`/sounds/${name}.mp3`);
    a.volume = 0.5;
    a.play().catch(() => {});
  } catch (_) {}
}

function PaperPlane({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ── Dialog تأكيد الحظر ────────────────────────────────────────
function BlockConfirmDialog({
  open, targetName, onConfirm, onCancel, loading,
}: {
  open: boolean; targetName: string;
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
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999, width: 'min(88vw, 320px)',
              background: 'var(--bg-elevated, #1a1a2e)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24, padding: '28px 24px 20px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.08)',
              direction: 'rtl',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(251,146,60,0.12)',
              border: '1px solid rgba(251,146,60,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <ShieldOff size={26} color="#fb923c" />
            </div>

            <p style={{
              textAlign: 'center', margin: '0 0 8px',
              color: 'var(--text-main, #fff)', fontWeight: 800, fontSize: 17,
            }}>
              حظر {targetName}؟
            </p>

            <p style={{
              textAlign: 'center', margin: '0 0 24px',
              color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6,
            }}>
              لن يتمكن من رؤيتك أو التواصل معك،
              وسيتم حذف جميع التفاعلات بينكما.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onCancel} disabled={loading} style={{
                flex: 1, padding: '13px 0', borderRadius: 14,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.65)',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                إلغاء
              </button>

              <motion.button
                whileTap={{ scale: 0.94 }} onClick={onConfirm} disabled={loading}
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 14,
                  background: loading ? 'rgba(251,146,60,0.3)' : 'linear-gradient(145deg,#fb923c,#ea580c)',
                  border: 'none', color: '#fff', fontWeight: 800, fontSize: 14,
                  cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(251,146,60,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    }} />
                ) : (
                  <><ShieldOff size={15} /> حظر</>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── زر ثلاثي الأبعاد ─────────────────────────────────────────
const BTN = 56;

function Btn3D({ onClick, disabled = false, active = false,
  activeGradient, depthColor, glowColor, icon, title }: {
  onClick: () => void; disabled?: boolean; active?: boolean;
  activeGradient: string; depthColor: string; glowColor: string;
  icon: React.ReactNode; title?: string;
}) {
  const shadow = active
    ? `0 2px 0 ${depthColor}, 0 6px 20px ${glowColor}, inset 0 2px 4px rgba(0,0,0,0.35)`
    : `0 5px 0 #0e0e1e, 0 8px 22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.22)`;
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.84, y: disabled ? 0 : 4 }}
      whileHover={{ scale: disabled ? 1 : 1.07, y: disabled ? 0 : -2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      onClick={onClick} disabled={disabled} title={title}
      style={{
        width: BTN, height: BTN, borderRadius: '50%',
        border: 'none', outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: active ? activeGradient : 'linear-gradient(145deg,#3a3a52 0%,#22223a 100%)',
        boxShadow: shadow, transition: 'box-shadow 0.18s, background 0.18s',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(ellipse at 38% 22%, rgba(255,255,255,0.2) 0%, transparent 62%)',
        pointerEvents: 'none',
      }} />
      {icon}
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
// Props
// ══════════════════════════════════════════════════════════════
export interface ProfileActionsProps {
  userId:        string;
  currentUserId: string;
  targetName?:   string;
  liked:         boolean;
  liking:        boolean;
  blocked:       boolean;
  msgFlash:      boolean;
  shared:        boolean;
  onLike:        () => void;
  onMessage:     () => void;
  onShare:       () => void;
  /** الأب ينفذ الحظر الفعلي + التنقل، يُرجع Promise<void> */
  onBlock:       () => Promise<void>;
}

export default function ProfileActions({
  userId, currentUserId, targetName = 'هذا المستخدم',
  liked, liking, blocked, msgFlash, shared,
  onLike, onMessage, onShare, onBlock,
}: ProfileActionsProps) {

  const [menu,         setMenu]         = useState(false);
  const [reportOpen,   setReportOpen]   = useState(false);
  const [blockDialog,  setBlockDialog]  = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const thumbCtrl = useAnimation();

  const handleLike = async () => {
    if (liking) return;
    playSound(liked ? 'unlike' : 'like');
    await thumbCtrl.start({
      scale:  [1, 1.55, 0.82, 1.22, 0.94, 1],
      rotate: [0, -12, 12, -6, 6, 0],
      transition: { duration: 0.5, times: [0, 0.18, 0.36, 0.55, 0.75, 1] },
    });
    onLike();
  };

  const handleShare = async () => {
    playSound('share');
    const deepLink = `https://zawaj.orcaup.com/view/?id=${userId}`;
    try {
      await Share.share({
        title: 'ملف زواج على تطبيق زواج AI',
        text:  'تفضّل/ي، شاهد/ي هذا الملف على تطبيق زواج AI',
        url:   deepLink, dialogTitle: 'مشاركة الملف عبر',
      });
    } catch {
      try {
        await navigator.clipboard.writeText(deepLink);
        import('sonner').then(({ toast }) => toast.success('تم نسخ الرابط', { duration: 2500 }));
      } catch {}
    }
    onShare();
  };

  const handleMessage = () => { playSound('message'); onMessage(); };

  const handleBlockConfirm = useCallback(async () => {
    setBlockLoading(true);
    try {
      await onBlock(); // الأب ينفذ + ينقل
    } finally {
      setBlockLoading(false);
      setBlockDialog(false);
    }
  }, [onBlock]);

  return (
    <>
      <BlockConfirmDialog
        open={blockDialog} targetName={targetName}
        onConfirm={handleBlockConfirm}
        onCancel={() => setBlockDialog(false)}
        loading={blockLoading}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, type: 'spring', stiffness: 280, damping: 22 }}
        style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 18 }}
      >

        {/* ── 👍 إعجاب ─────────────────────────────────────── */}
        <motion.button
          animate={thumbCtrl}
          whileTap={{ scale: liking ? 1 : 0.84, y: liking ? 0 : 4 }}
          whileHover={{ scale: liking ? 1 : 1.07, y: liking ? 0 : -2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          onClick={handleLike} disabled={liking}
          title={liked ? 'إلغاء الإعجاب' : 'إعجاب'}
          style={{
            width: BTN, height: BTN, borderRadius: '50%',
            border: 'none', outline: 'none',
            cursor: liking ? 'default' : 'pointer',
            opacity: liking ? 0.45 : 1,
            flexShrink: 0, position: 'relative', overflow: 'hidden',
            background: liked
              ? 'linear-gradient(145deg,#c8002c 0%,#8a0018 100%)'
              : 'linear-gradient(145deg,#3a3a52 0%,#22223a 100%)',
            boxShadow: liked
              ? '0 2px 0 #5a000e, 0 6px 20px rgba(192,0,42,0.55), inset 0 2px 4px rgba(0,0,0,0.35)'
              : '0 5px 0 #0e0e1e, 0 8px 22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.22)',
            transition: 'box-shadow 0.18s, background 0.18s',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(ellipse at 38% 22%, rgba(255,255,255,0.2) 0%, transparent 62%)',
            pointerEvents: 'none',
          }} />
          {liked
            ? <ThumbsDown size={22} color="#fff" strokeWidth={2} />
            : <ThumbsUp   size={22} color="#fff" fill="#fff" strokeWidth={1.4} />
          }
        </motion.button>

        {/* ── ✈️ رسالة ─────────────────────────────────────── */}
        <Btn3D
          onClick={handleMessage} active={msgFlash}
          activeGradient="linear-gradient(145deg,#0ea5e9,#0369a1)"
          depthColor="#0c4a6e" glowColor="rgba(14,165,233,0.5)"
          title="إرسال رسالة"
          icon={<PaperPlane size={21} color="#fff" />}
        />

        {/* ── 🔗 مشاركة ───────────────────────────────────── */}
        <Btn3D
          onClick={handleShare} active={shared}
          activeGradient="linear-gradient(145deg,#22c55e,#15803d)"
          depthColor="#14532d" glowColor="rgba(34,197,94,0.5)"
          title="مشاركة الملف"
          icon={shared
            ? <Check  size={21} color="#fff" strokeWidth={2.3} />
            : <Share2 size={20} color="#fff" strokeWidth={1.6} />
          }
        />

        {/* ── ⋮ المزيد ─────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <Btn3D
            onClick={() => setMenu(v => !v)} active={menu}
            activeGradient="linear-gradient(145deg,#555570,#35354a)"
            depthColor="#1e1e2e" glowColor="rgba(80,80,120,0.4)"
            title="المزيد"
            icon={
              <svg width={20} height={20} viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)" stroke="none">
                <circle cx="12" cy="5"  r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="12" cy="19" r="1.8" />
              </svg>
            }
          />

          <AnimatePresence>
            {menu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.82, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.82, y: 10 }}
                  transition={{ type: 'spring', stiffness: 440, damping: 32 }}
                  style={{
                    position: 'absolute', bottom: BTN + 14, left: '50%',
                    transform: 'translateX(-50%)', zIndex: 101,
                    background: 'var(--bg-elevated, #1a1a2e)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, overflow: 'hidden', width: 162,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <div style={{
                    position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                    width: 12, height: 6,
                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                    borderTop: '6px solid var(--bg-elevated, #1a1a2e)',
                  }} />

                  {/* إبلاغ */}
                  <button
                    onClick={() => { setMenu(false); setReportOpen(true); }}
                    style={{
                      width: '100%', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
                      background: 'transparent', border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer', color: '#fca5a5',
                      fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 14 }}>🚩</span> إبلاغ
                  </button>

                  {/* حظر */}
                  <button
                    onClick={() => { setMenu(false); if (!blocked) setBlockDialog(true); }}
                    disabled={blocked}
                    style={{
                      width: '100%', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
                      background: 'transparent', border: 'none',
                      cursor: blocked ? 'default' : 'pointer',
                      color: blocked ? '#86efac' : '#fdba74',
                      fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                      opacity: blocked ? 0.7 : 1,
                    }}
                    onMouseEnter={e => { if (!blocked) e.currentTarget.style.background = 'rgba(251,146,60,0.08)'; }}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <ShieldOff size={14} /> {blocked ? 'تم الحظر ✓' : 'حظر'}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <ReportSheet
        open={reportOpen} onClose={() => setReportOpen(false)}
        reportedUserId={userId} targetType="profile" targetId={userId}
      />
    </>
  );
}