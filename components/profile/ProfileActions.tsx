'use client';
/**
 * 📁 components/profile/ProfileActions.tsx — ZAWAJ AI
 * أزرار الملف الشخصي — مع نظام حظر حقيقي + تصميم ثلاثي الأبعاد
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ThumbsUp, Share2, MoreVertical, ShieldOff, Check } from 'lucide-react';
import ReportSheet from '@/components/security/ReportSheet';
import { supabase } from '@/lib/supabase/client';

// ── صوت ───────────────────────────────────────────────────────
function playSound(name: 'like' | 'unlike' | 'message' | 'share') {
  try {
    const a = new Audio(`/sounds/${name}.mp3`);
    a.volume = 0.5;
    a.play().catch(() => {});
  } catch (_) {}
}

// ── جسيمات الإعجاب ────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  r: number;
  s: number;
}

function LikeBurst({ active }: { active: boolean }) {
  const [ps, setPs] = useState<Particle[]>([]);
  const prev = useRef(false);

  if (active && !prev.current) {
    const next = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 100,
      y: -(Math.random() * 80 + 20),
      r: (Math.random() - 0.5) * 80,
      s: Math.random() * 0.6 + 0.3,
    }));
    setPs(next);
    setTimeout(() => setPs([]), 800);
  }

  prev.current = active;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <AnimatePresence>
        {ps.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: p.s, rotate: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 0, rotate: p.r }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginLeft: -6,
              marginTop: -6,
              fontSize: 12,
              color: '#22c55e',
            }}
          >
            👍
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Props
// ══════════════════════════════════════════════════════════════
export interface ProfileActionsProps {
  userId: string;
  currentUserId: string;

  liked: boolean;
  liking: boolean;

  onLike: () => void;
  onMessage: () => void;
  onShare: () => void;

  msgFlash?: boolean;
  shared?: boolean;
  blocked?: boolean;
}

const BTN = 58;

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════
export default function ProfileActions({
  userId,
  currentUserId,
  liked,
  liking,
  onLike,
  onMessage,
  onShare,
  msgFlash = false,
  shared = false,
  blocked = false,
}: ProfileActionsProps) {
  const [menu, setMenu] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [burst, setBurst] = useState(false);

  const ctrl = useAnimation();

  // ── لايك ─────────────────────────────────────────────
  const handleLike = async () => {
    if (liking) return;

    if (!liked) {
      playSound('like');
      setBurst(true);

      await ctrl.start({
        scale: [1, 1.6, 0.8, 1.2, 1],
        rotate: [0, -10, 10, 0],
        transition: { duration: 0.5 },
      });

      setTimeout(() => setBurst(false), 800);
    } else {
      playSound('unlike');
      await ctrl.start({ scale: [1, 0.8, 1], transition: { duration: 0.2 } });
    }

    onLike();
  };

  // ── حظر حقيقي (DB) ─────────────────────────────────
  const handleBlock = async () => {
    try {
      const { data } = await supabase
        .from('blocks')
        .select('*')
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', userId)
        .maybeSingle();

      if (data) {
        // إلغاء الحظر
        await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', userId);
      } else {
        // إضافة حظر
        await supabase.from('blocks').insert({
          blocker_id: currentUserId,
          blocked_id: userId,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('[BLOCK ERROR]', e);
    }

    setMenu(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          marginTop: 18,
        }}
      >
        {/* ── 👍 إعجاب (3D) ───────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <LikeBurst active={burst} />

          <motion.button
            animate={ctrl}
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            disabled={liking}
            style={{
              width: BTN,
              height: BTN,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              background: liked
                ? 'linear-gradient(145deg,#1db954,#0e7a3a)'
                : 'linear-gradient(145deg,#2a2a2a,#141414)',
              boxShadow: liked
                ? '0 6px 20px rgba(29,185,84,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                : '0 6px 18px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ThumbsUp
              size={22}
              color={liked ? '#fff' : '#aaa'}
              fill={liked ? '#fff' : 'none'}
            />
          </motion.button>
        </div>

        {/* ── رسالة ───────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={onMessage}
          style={{
            width: BTN,
            height: BTN,
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(145deg,#222,#111)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          ✈️
        </motion.button>

        {/* ── مشاركة ───────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={onShare}
          style={{
            width: BTN,
            height: BTN,
            borderRadius: '50%',
            border: 'none',
            background: shared
              ? 'linear-gradient(145deg,#22c55e,#15803d)'
              : 'linear-gradient(145deg,#222,#111)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {shared ? <Check size={20} color="#fff" /> : <Share2 size={20} />}
        </motion.button>

        {/* ── المزيد / حظر ───────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setMenu(v => !v)}
            style={{
              width: BTN,
              height: BTN,
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(145deg,#222,#111)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <MoreVertical size={20} />
          </motion.button>

          <AnimatePresence>
            {menu && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                  }}
                  onClick={() => setMenu(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    position: 'absolute',
                    bottom: BTN + 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: 14,
                    overflow: 'hidden',
                    minWidth: 150,
                    zIndex: 10,
                  }}
                >
                  <button
                    onClick={() => {
                      setReportOpen(true);
                      setMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                    }}
                  >
                    🚩 إبلاغ
                  </button>

                  <button
                    onClick={handleBlock}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'transparent',
                      border: 'none',
                      color: blocked ? '#22c55e' : '#fbbf24',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldOff size={16} />
                    {blocked ? 'تم الحظر' : 'حظر'}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

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