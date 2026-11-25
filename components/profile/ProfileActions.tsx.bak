'use client';
/**
 * 📁 components/profile/ProfileActions.tsx — ZAWAJ AI v6
 * ✅ Dialog توسيط صحيح على Android (flex wrapper)
 * ✅ ألوان الأزرار متوافقة مع الوضعين عبر CSS vars
 * ✅ ThumbsUp دائماً مرفوع — fill أبيض عند الإعجاب
 * ✅ أيقونات مُوسَّطة داخل الدوائر بـ flexbox
 * ✅ لا تعارض مع globals.css (svg fill override)
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Share2, ShieldOff, Check, ThumbsUp, ShieldCheck } from 'lucide-react';
import { Share } from '@capacitor/share';
import ReportSheet from '@/components/security/ReportSheet';

// ── أصوات ─────────────────────────────────────────────────────
function playSound(name: 'like' | 'unlike' | 'message' | 'share') {
  try { const a = new Audio(`/sounds/${name}.mp3`); a.volume = 0.5; a.play().catch(() => {}); } catch {}
}

// ── أيقونة الإرسال (SVG خام بدون تأثير globals) ──────────────
function SendIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ display: 'block', fill: 'none', stroke: '#fff', strokeWidth: 1.8,
               strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon style={{ fill: '#fff', stroke: '#fff', strokeWidth: 1.8 }}
        points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ── ثلاث نقاط (SVG خام) ──────────────────────────────────────
function DotsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      style={{ display: 'block', fill: 'var(--text-main)', stroke: 'none' }}>
      <circle cx="12" cy="5"  r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

// ── Dialog تأكيد الحظر ────────────────────────────────────────
function BlockConfirmDialog({ open, targetName, onConfirm, onCancel, loading }: {
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
            style={{ position: 'fixed', inset: 0, zIndex: 9998,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />
          {/* ✅ wrapper flex يضمن التوسيط على كل الأجهزة */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 20px', pointerEvents: 'none',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 32 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              style={{
                width: '100%', maxWidth: 320,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)',
                borderRadius: 24, padding: '28px 22px 22px',
                boxShadow: 'var(--shadow-deep)',
                direction: 'rtl', pointerEvents: 'auto',
              }}
            >
              {/* أيقونة */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(251,146,60,0.1)',
                border: '1px solid rgba(251,146,60,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <ShieldOff size={26} color="#fb923c" strokeWidth={1.8} />
              </div>
              <p style={{ textAlign: 'center', margin: '0 0 8px',
                color: 'var(--text-main)', fontWeight: 800, fontSize: 17 }}>
                حظر {targetName}؟
              </p>
              <p style={{ textAlign: 'center', margin: '0 0 24px',
                color: 'var(--text-tertiary)', fontSize: 13, lineHeight: 1.65 }}>
                لن يتمكن من رؤيتك أو التواصل معك، وسيتم حذف جميع التفاعلات بينكما.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onCancel} disabled={loading} style={{
                  flex: 1, padding: '13px 0', borderRadius: 14,
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>إلغاء</button>
                <motion.button whileTap={{ scale: 0.94 }} onClick={onConfirm} disabled={loading}
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 14,
                    background: loading ? 'rgba(251,146,60,0.25)' : 'linear-gradient(145deg,#fb923c,#ea580c)',
                    border: 'none', color: '#fff', fontWeight: 800, fontSize: 14,
                    cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(251,146,60,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  {loading
                    ? <motion.div animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        style={{ width: 16, height: 16, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    : <><ShieldOff size={14} strokeWidth={2} /> حظر</>
                  }
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── زر 3D ─────────────────────────────────────────────────────
const BTN = 56;

function Btn3D({ onClick, disabled = false, active = false,
  activeGradient, activeDepth, activeGlow, icon, title }: {
  onClick: () => void; disabled?: boolean; active?: boolean;
  activeGradient: string; activeDepth: string; activeGlow: string;
  icon: React.ReactNode; title?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.84, y: disabled ? 0 : 4 }}
      whileHover={{ scale: disabled ? 1 : 1.06, y: disabled ? 0 : -2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      onClick={onClick} disabled={disabled} title={title}
      style={{
        width: BTN, height: BTN, borderRadius: '50%',
        border: 'none', outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, flexShrink: 0,
        /* ✅ flex لتوسيط الأيقونة */
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: active ? activeGradient : 'var(--btn3d-idle)',
        boxShadow: active
          ? `0 2px 0 ${activeDepth}, 0 6px 18px ${activeGlow}, inset 0 1px 3px rgba(255,255,255,0.15)`
          : '0 5px 0 var(--btn3d-depth), 0 8px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.15)',
        transition: 'box-shadow 0.18s, background 0.18s',
      }}
    >
      {/* هالة */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 36% 20%, rgba(255,255,255,0.22) 0%, transparent 60%)',
      }} />
      {/* الأيقونة — position relative فوق الهالة */}
      <div style={{ position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
    </motion.button>
  );
}

// ── CSS vars: idle buttons لكلا الوضعين ──────────────────────
const BTN3D_VARS = `
:root {
  --btn3d-idle:  linear-gradient(145deg, #3a3a52 0%, #22223a 100%);
  --btn3d-depth: #0e0e1e;
}
html.light {
  --btn3d-idle:  linear-gradient(145deg, #c8c8dc 0%, #a8a8c0 100%);
  --btn3d-depth: #7878a0;
}
`;

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
      scale:  [1, 1.5, 0.84, 1.2, 0.96, 1],
      rotate: [0, -10, 10, -5, 5, 0],
      transition: { duration: 0.48, times: [0, 0.18, 0.36, 0.55, 0.75, 1] },
    });
    onLike();
  };

  const handleShare = async () => {
    playSound('share');
    // ✅ رابط الصفحة الوسيطة بدلاً من view مباشرة
    const shareLink = `https://zawaj.orcaup.com/share/?id=${userId}`;
    try {
      await Share.share({
        title: 'ملف زواج على تطبيق زواج AI',
        text:  'شاهد هذا الملف على تطبيق زواج AI',
        url:   shareLink, dialogTitle: 'مشاركة الملف عبر',
      });
    } catch {
      try {
        await navigator.clipboard.writeText(shareLink);
        import('sonner').then(({ toast }) => toast.success('تم نسخ الرابط', { duration: 2500 }));
      } catch {}
    }
    onShare();
  };

  const handleMessage = () => { playSound('message'); onMessage(); };

  const handleBlockConfirm = useCallback(async () => {
    setBlockLoading(true);
    try { await onBlock(); }
    finally { setBlockLoading(false); setBlockDialog(false); }
  }, [onBlock]);

  return (
    <>
      <style>{BTN3D_VARS}</style>

      <BlockConfirmDialog
        open={blockDialog} targetName={targetName}
        onConfirm={handleBlockConfirm}
        onCancel={() => setBlockDialog(false)}
        loading={blockLoading}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, type: 'spring', stiffness: 280, damping: 22 }}
        style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 18 }}
      >

        {/* ── 👍 إعجاب ─────────────────────────────────────── */}
        <motion.button
          animate={thumbCtrl}
          whileTap={{ scale: liking ? 1 : 0.84, y: liking ? 0 : 4 }}
          whileHover={{ scale: liking ? 1 : 1.06, y: liking ? 0 : -2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          onClick={handleLike} disabled={liking} title={liked ? 'إلغاء الإعجاب' : 'إعجاب'}
          style={{
            width: BTN, height: BTN, borderRadius: '50%',
            border: 'none', outline: 'none',
            cursor: liking ? 'default' : 'pointer',
            opacity: liking ? 0.45 : 1, flexShrink: 0,
            /* ✅ flex لتوسيط الأيقونة */
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            background: liked
              ? 'linear-gradient(145deg,#c8002c 0%,#8a0018 100%)'
              : 'var(--btn3d-idle)',
            boxShadow: liked
              ? '0 2px 0 #5a000e, 0 6px 18px rgba(192,0,42,0.5), inset 0 1px 3px rgba(255,255,255,0.12)'
              : '0 5px 0 var(--btn3d-depth), 0 8px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.15)',
            transition: 'box-shadow 0.18s, background 0.18s',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 36% 20%, rgba(255,255,255,0.22) 0%, transparent 60%)',
          }} />
          {/* ✅ ThumbsUp دائماً مرفوع — fill عند الإعجاب */}
          <div style={{ position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ThumbsUp
              size={22}
              style={{
                display: 'block',
                fill: liked ? '#fff' : 'none',
                stroke: '#fff',
                strokeWidth: liked ? 0 : 2,
              }}
            />
          </div>
        </motion.button>

        {/* ── ✈️ رسالة ─────────────────────────────────────── */}
        <Btn3D
          onClick={handleMessage} active={msgFlash}
          activeGradient="linear-gradient(145deg,#0ea5e9,#0369a1)"
          activeDepth="#0c4a6e" activeGlow="rgba(14,165,233,0.4)"
          title="إرسال رسالة"
          icon={<SendIcon size={20} />}
        />

        {/* ── 🔗 مشاركة ───────────────────────────────────── */}
        <Btn3D
          onClick={handleShare} active={shared}
          activeGradient="linear-gradient(145deg,#22c55e,#15803d)"
          activeDepth="#14532d" activeGlow="rgba(34,197,94,0.4)"
          title="مشاركة الملف"
          icon={shared
            ? <Check  size={20} style={{ display:'block', stroke:'#fff', fill:'none', strokeWidth:2.5 }} />
            : <Share2 size={19} style={{ display:'block', stroke:'#fff', fill:'none', strokeWidth:1.7 }} />
          }
        />

        {/* ── ⋮ المزيد ─────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <Btn3D
            onClick={() => setMenu(v => !v)} active={menu}
            activeGradient="linear-gradient(145deg,#555570,#35354a)"
            activeDepth="#1e1e2e" activeGlow="rgba(80,80,120,0.35)"
            title="المزيد"
            icon={<DotsIcon size={18} />}
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
                    position: 'absolute', bottom: BTN + 12, left: '50%',
                    transform: 'translateX(-50%)', zIndex: 101,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 20, overflow: 'hidden', width: 164,
                    boxShadow: 'var(--shadow-deep)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div style={{
                    position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                    width: 12, height: 6,
                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                    borderTop: '6px solid var(--bg-elevated)',
                  }} />

                  {/* إبلاغ */}
                  <button onClick={() => { setMenu(false); setReportOpen(true); }}
                    style={{
                      width: '100%', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
                      background: 'transparent', border: 'none',
                      borderBottom: '1px solid var(--glass-border)',
                      cursor: 'pointer', color: '#fca5a5',
                      fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>🚩</span> إبلاغ
                  </button>

                  {/* حظر */}
                  <button
                    onClick={() => { setMenu(false); if (!blocked) setBlockDialog(true); }}
                    disabled={blocked}
                    style={{
                      width: '100%', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
                      background: 'transparent', border: 'none',
                      cursor: blocked ? 'default' : 'pointer',
                      color: blocked ? '#86efac' : '#fdba74',
                      fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                      opacity: blocked ? 0.7 : 1,
                    }}
                    onMouseEnter={e => { if (!blocked) e.currentTarget.style.background = 'rgba(251,146,60,0.07)'; }}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {blocked
                      ? <ShieldCheck size={14} color="#86efac" strokeWidth={2} />
                      : <ShieldOff   size={14} color="#fdba74" strokeWidth={2} />
                    }
                    {blocked ? 'تم الحظر ✓' : 'حظر'}
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