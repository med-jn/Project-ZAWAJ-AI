'use client';
/**
 * 📁 components/profile/ProfileActions.tsx — ZAWAJ AI
 * أزرار الملف الشخصي — فاخرة في الوضعين
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Heart, Share2, MoreVertical, ShieldOff, Check } from 'lucide-react';
import ReportSheet from '@/components/security/ReportSheet';

// ── صوت ───────────────────────────────────────────────────────
function playSound(name: 'like' | 'unlike' | 'message' | 'share') {
  try {
    const a = new Audio(`/sounds/${name}.mp3`);
    a.volume = 0.5;
    a.play().catch(() => {});
  } catch (_) {}
}

// ── جسيمات القلب ──────────────────────────────────────────────
interface Particle { id: number; x: number; y: number; r: number; s: number }

function HeartBurst({ active }: { active: boolean }) {
  const [ps, setPs] = useState<Particle[]>([]);

  // نطلق الجسيمات عند تغيير active إلى true
  const prevActive = useRef(false);
  if (active && !prevActive.current) {
    const next: Particle[] = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 100,
      y: -(Math.random() * 80 + 15),
      r: (Math.random() - 0.5) * 80,
      s: Math.random() * 0.6 + 0.2,
    }));
    setPs(next);
    setTimeout(() => setPs([]), 900);
  }
  prevActive.current = active;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 20 }}>
      <AnimatePresence>
        {ps.map(p => (
          <motion.div key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: p.s, rotate: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 0, rotate: p.r }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              marginLeft: -6, marginTop: -6,
              fontSize: 12, color: '#ef4444',
              pointerEvents: 'none', userSelect: 'none',
            }}>
            ♥
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── أيقونة الإرسال ────────────────────────────────────────────
function PaperPlane({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// الـ props
// ══════════════════════════════════════════════════════════════
export interface ProfileActionsProps {
  userId:       string;         // المستخدم المستهدف
  currentUserId: string;        // المستخدم الحالي
  liked:        boolean;
  liking:       boolean;
  onLike:       () => void;
  onMessage:    () => void;
  onShare:      () => void;
  onBlock:      () => void;
  msgFlash?:    boolean;
  shared?:      boolean;
  blocked?:     boolean;
}

const BTN = 56; // حجم موحد

export default function ProfileActions({
  userId, currentUserId,
  liked, liking,
  onLike, onMessage, onShare, onBlock,
  msgFlash = false,
  shared   = false,
  blocked  = false,
}: ProfileActionsProps) {

  const [menu,       setMenu]       = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [burst,      setBurst]      = useState(false);
  const heartCtrl = useAnimation();

  const handleLike = async () => {
    if (liking) return;
    if (!liked) {
      playSound('like');
      setBurst(true);
      await heartCtrl.start({
        scale:  [1, 1.6, 0.78, 1.28, 0.92, 1],
        rotate: [0, -10, 10, -5, 5, 0],
        transition: { duration: 0.55, times: [0, 0.17, 0.34, 0.55, 0.75, 1] },
      });
      setTimeout(() => setBurst(false), 900);
    } else {
      playSound('unlike');
      await heartCtrl.start({ scale: [1, 0.6, 1.05, 1], transition: { duration: 0.28 } });
    }
    onLike();
  };

  const handleMessage = () => {
    playSound('message');
    onMessage();
  };

  const handleShare = () => {
    playSound('share');
    onShare();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, type: 'spring', stiffness: 280, damping: 22 }}
        style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 18 }}
      >

        {/* ── ❤️ إعجاب ──────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <HeartBurst active={burst} />
          <motion.button
            animate={heartCtrl}
            whileTap={{ scale: liking ? 1 : 0.75 }}
            whileHover={{ scale: liking ? 1 : 1.08 }}
            onClick={handleLike}
            disabled={liking}
            title={liked ? 'إلغاء الإعجاب' : 'إعجاب'}
            style={{
              width: BTN, height: BTN, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative',
              cursor: liking ? 'default' : 'pointer',
              border: 'none', outline: 'none',
              // ضوء وخلفية ديناميكية
              background: liked
                ? 'linear-gradient(145deg, rgba(239,68,68,0.28), rgba(239,68,68,0.08))'
                : 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              boxShadow: liked
                ? '0 0 28px rgba(239,68,68,0.5), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
                : '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
              // حدود ناعمة
              outline: liked
                ? '1.5px solid rgba(239,68,68,0.55)'
                : '1.5px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
            <Heart
              size={22}
              fill={liked ? '#ef4444' : 'none'}
              strokeWidth={liked ? 0 : 1.6}
              color={liked ? '#ef4444' : 'rgba(255,255,255,0.6)'}
              style={{ filter: liked ? 'drop-shadow(0 0 6px rgba(239,68,68,0.8))' : 'none', transition: 'all 0.22s ease' }}
            />
          </motion.button>
        </div>

        {/* ── ✈️ رسالة ───────────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.75 }}
          whileHover={{ scale: 1.08 }}
          onClick={handleMessage}
          title="إرسال رسالة"
          style={{
            width: BTN, height: BTN, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer',
            border: 'none', outline: 'none',
            background: msgFlash
              ? 'linear-gradient(145deg, rgba(56,189,248,0.28), rgba(56,189,248,0.08))'
              : 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
            boxShadow: msgFlash
              ? '0 0 28px rgba(56,189,248,0.5), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
              : '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
            outline: msgFlash
              ? '1.5px solid rgba(56,189,248,0.5)'
              : '1.5px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.25s ease',
          }}>
          <PaperPlane
            size={21}
            color={msgFlash ? '#38bdf8' : 'rgba(255,255,255,0.6)'}
          />
        </motion.button>

        {/* ── 🔗 مشاركة ─────────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.75 }}
          whileHover={{ scale: 1.08 }}
          onClick={handleShare}
          title="مشاركة الملف"
          style={{
            width: BTN, height: BTN, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer',
            border: 'none', outline: 'none',
            background: shared
              ? 'linear-gradient(145deg, rgba(34,197,94,0.28), rgba(34,197,94,0.08))'
              : 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
            boxShadow: shared
              ? '0 0 28px rgba(34,197,94,0.5), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
              : '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
            outline: shared
              ? '1.5px solid rgba(34,197,94,0.5)'
              : '1.5px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.25s ease',
          }}>
          {shared
            ? <Check size={21} color="#22c55e" strokeWidth={2.3} style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.8))' }} />
            : <Share2 size={20} color="rgba(255,255,255,0.6)" strokeWidth={1.6} />}
        </motion.button>

        {/* ── ⋮ ثلاث نقاط ───────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <motion.button
            whileTap={{ scale: 0.75 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => setMenu(v => !v)}
            title="المزيد"
            style={{
              width: BTN, height: BTN, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, cursor: 'pointer',
              border: 'none', outline: 'none',
              background: menu
                ? 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))'
                : 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
              outline: '1.5px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease',
            }}>
            <MoreVertical size={20} color="rgba(255,255,255,0.55)" strokeWidth={1.6} />
          </motion.button>

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
                    transform: 'translateX(-50%)',
                    zIndex: 101,
                    background: 'var(--bg-elevated)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, overflow: 'hidden', width: 162,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}>

                  {/* مثلث صغير يشير للزر */}
                  <div style={{
                    position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                    width: 12, height: 6,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid var(--bg-elevated)',
                  }} />

                  <button onClick={() => { setMenu(false); setReportOpen(true); }}
                    style={{
                      width: '100%', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
                      background: 'transparent', border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer', color: '#fca5a5',
                      fontFamily: 'inherit',
                      fontSize: 'calc(var(--base-font-size) * 0.84)',
                      fontWeight: 600,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 14 }}>🚩</span> إبلاغ
                  </button>

                  <button onClick={() => { setMenu(false); onBlock(); }}
                    style={{
                      width: '100%', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
                      background: 'transparent', border: 'none',
                      cursor: 'pointer',
                      color: blocked ? '#86efac' : '#fdba74',
                      fontFamily: 'inherit',
                      fontSize: 'calc(var(--base-font-size) * 0.84)',
                      fontWeight: 600,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,146,60,0.08)')}
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

      {/* ReportSheet */}
      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUserId={userId}
        targetType="profile"
        targetId={userId}
      />
    </>
  );
}