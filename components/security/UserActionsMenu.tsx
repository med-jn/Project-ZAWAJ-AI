'use client';
/**
 * 📁 components/security/UserActionsMenu.tsx — ZAWAJ AI
 * قائمة الثلاث نقاط الموحّدة (إبلاغ / حظر) — تُستخدم في صفحة الملف وصفحة الدردشة بنفس الشكل.
 * ضعها داخل عنصر أب position: relative بجانب زر ⋮.
 *   placement="top"    ← تُفتح فوق الزر (صفحة الملف: الزر في الأسفل)
 *   placement="bottom" ← تُفتح تحت الزر (الدردشة: الزر في الرأس)
 *   confirmBlock       ← true: تعرض نافذة تأكيد قبل الحظر (الدردشة)، false: المضيف يتولى التأكيد (الملف)
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, Flag, ShieldCheck } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onReport: () => void;
  onBlock: () => void;
  blocked?: boolean;
  placement?: 'top' | 'bottom';
  confirmBlock?: boolean;
  targetName?: string;
};

const ROW: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  direction: 'rtl',
  textAlign: 'right',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 700,
};

const iconWrap = (color: string): React.CSSProperties => ({
  width: 30,
  height: 30,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `${color}22`,
  flexShrink: 0,
});

export default function UserActionsMenu({
  open,
  onClose,
  onReport,
  onBlock,
  blocked = false,
  placement = 'bottom',
  confirmBlock = true,
  targetName,
}: Props) {
  const [confirm, setConfirm] = useState(false);
  const top = placement === 'top';

  const overlays =
    typeof document === 'undefined'
      ? null
      : createPortal(
          <AnimatePresence>
            {open && (
              <div
                key="menu-backdrop"
                style={{ position: 'fixed', inset: 0, zIndex: 1190 }}
                onClick={onClose}
              />
            )}
            {confirm && (
              <motion.div
                key="block-confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirm(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 1300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  background: 'rgba(0,0,0,0.6)',
                }}
              >
                <motion.div
                  initial={{ scale: 0.92 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.92 }}
                  dir="rtl"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    maxWidth: 340,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 22,
                    padding: 20,
                    boxShadow: 'var(--shadow-deep)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={iconWrap('#fb923c')}>
                      <Ban size={16} color="#fdba74" strokeWidth={2.2} fill="none" />
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>
                      حظر {targetName || 'هذا المستخدم'}؟
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.8,
                      color: 'var(--text-secondary)',
                      marginBottom: 18,
                    }}
                  >
                    لن يتمكن أي منكما من التواصل مع الآخر.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => {
                        setConfirm(false);
                        onBlock();
                      }}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 14,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: 800,
                        fontSize: 14,
                        color: '#fff',
                        background: '#c2410c',
                      }}
                    >
                      تأكيد الحظر
                    </button>
                    <button
                      onClick={() => setConfirm(false)}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 14,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'var(--text-main)',
                        background: 'transparent',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="menu-panel"
            initial={{ opacity: 0, scale: 0.9, y: top ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: top ? 8 : -8 }}
            transition={{ duration: 0.14 }}
            dir="rtl"
            style={{
              position: 'absolute',
              zIndex: 1191,
              width: 184,
              left: top ? '50%' : 0,
              x: top ? '-50%' : 0,
              ...(top ? { bottom: 'calc(100% + 12px)' } : { top: 50 }),
              transformOrigin: top ? 'bottom center' : 'top left',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--glass-border)',
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-deep)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <button
              onClick={() => {
                onClose();
                onReport();
              }}
              style={{ ...ROW, color: '#fca5a5', borderBottom: '1px solid var(--glass-border)' }}
            >
              <span style={iconWrap('#ef4444')}>
                <Flag size={16} color="#f87171" strokeWidth={2.2} fill="none" />
              </span>
              إبلاغ
            </button>

            <button
              disabled={blocked}
              onClick={() => {
                onClose();
                if (blocked) return;
                if (confirmBlock) setConfirm(true);
                else onBlock();
              }}
              style={{
                ...ROW,
                color: blocked ? '#86efac' : '#fdba74',
                cursor: blocked ? 'default' : 'pointer',
                opacity: blocked ? 0.75 : 1,
              }}
            >
              <span style={iconWrap(blocked ? '#22c55e' : '#fb923c')}>
                {blocked ? (
                  <ShieldCheck size={16} color="#86efac" strokeWidth={2.2} fill="none" />
                ) : (
                  <Ban size={16} color="#fdba74" strokeWidth={2.2} fill="none" />
                )}
              </span>
              {blocked ? 'تم الحظر' : 'حظر'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {overlays}
    </>
  );
}
