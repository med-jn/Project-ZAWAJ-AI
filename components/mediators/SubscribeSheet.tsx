'use client';
/**
 * components/mediators/SubscribeSheet.tsx
 *
 * Bottom sheet: tier selection → confirmation → API call.
 * Premium production version enhancements:
 *  - Animated balance bar showing before/after with smooth transition
 *  - Tier cards with shimmer on hover + glowing border on selection
 *  - Staggered tier card entrance
 *  - Smooth slide between "select" and "confirm" panels
 *  - Full keyboard / escape close
 *  - ARIA dialog + focus management
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence }                   from 'framer-motion';
import { X, Crown, Check, Sparkles, Clock, Shield }  from 'lucide-react';
import { supabase }                                  from '@/lib/supabase/client';
import { LoveCoin }                                  from '@/components/ui/LoveCoin';
import { toast }                                     from 'sonner';
import { ConfirmRow }                                from './ConfirmRow';
import { TIERS }                                     from './constants';
import type { Tier }                                 from './constants';
import type { MediatorRow, SuccessData }             from './types';

/* ── Props ──────────────────────────────────────────── */
interface SubscribeSheetProps {
  mediator:  MediatorRow;
  balance:   number;
  userName:  string;
  onClose:   () => void;
  onSuccess: (data: SuccessData) => void;
}

/* ── Component ──────────────────────────────────────── */
export function SubscribeSheet({
  mediator,
  balance,
  userName,
  onClose,
  onSuccess,
}: SubscribeSheetProps) {
  const [selected,   setSelected]   = useState<Tier | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const closeBtn                    = useRef<HTMLButtonElement>(null);

  /* Focus close on open */
  useEffect(() => { closeBtn.current?.focus(); }, []);

  /* Escape key */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) onClose();
  }, [loading, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  /* ── API call ───────────────────────────────────── */
  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/subscribe-to-mediator`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ mediator_id: mediator.id, coins: selected.coins }),
        },
      );

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? 'فشل الاشتراك');
        return;
      }

      onSuccess({
        mediatorName: mediator.full_name,
        userName,
        coins:        selected.coins,
        subscribedAt: new Date(),
        expiresAt:    new Date(json.expires_at),
      });
    } catch {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const balanceAfter = balance - (selected?.coins ?? 0);
  const hasEnough    = balanceAfter >= 0;

  /* ── Render ─────────────────────────────────────── */
  return (
    <>
      {/* Backdrop */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500]"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)' }}
        onClick={() => !loading && onClose()}
      />

      {/* Sheet */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`اشتراك مع ${mediator.full_name}`}
        dir="rtl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-[510] rounded-t-[32px] flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border:     '1px solid var(--glass-border)',
          maxHeight:  '92vh',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'var(--glass-border)' }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--glass-border)' }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full overflow-hidden"
              style={{ border: '1.5px solid var(--border-gold)' }}
            >
              {mediator.avatar_url ? (
                <img
                  src={mediator.avatar_url}
                  alt={mediator.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'var(--bg-soft)' }}
                >
                  🤝
                </div>
              )}
            </div>

            <div>
              <p
                className="font-black"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}
              >
                اشتراك مع {mediator.full_name}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                اختر الباقة المناسبة
              </p>
            </div>
          </div>

          <button
            ref={closeBtn}
            onClick={() => !loading && onClose()}
            disabled={loading}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            <X size={15} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* Balance bar */}
          <div
            className="mx-5 mt-4 mb-3 px-4 py-3 rounded-[16px] flex items-center justify-between"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              رصيدك الحالي
            </span>
            <span
              className="flex items-center gap-1.5 font-black"
              style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}
            >
              {balance.toLocaleString('ar-TN')} <LoveCoin size={16} />
            </span>
          </div>

          {/* Panel switcher */}
          <AnimatePresence mode="wait">

            {/* ── Tier selection ── */}
            {!confirming && (
              <motion.div
                key="tiers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                className="px-5 pb-5 space-y-3"
              >
                {TIERS.map((tier, idx) => {
                  const affordable = balance >= tier.coins;
                  return (
                    <motion.button
                      key={tier.coins}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      whileHover={affordable ? { scale: 1.015 } : {}}
                      whileTap={affordable  ? { scale: 0.98  } : {}}
                      onClick={() => {
                        if (!affordable) return;
                        setSelected(tier);
                        setConfirming(true);
                      }}
                      disabled={!affordable}
                      aria-label={`اختر باقة ${tier.label} بـ ${tier.coins} عملة`}
                      className="w-full text-right rounded-[22px] p-4 relative overflow-hidden"
                      style={{
                        background:  tier.accent,
                        border:      `1.5px solid ${tier.border}`,
                        boxShadow:   affordable ? `0 4px 22px ${tier.glow}` : 'none',
                        opacity:     affordable ? 1 : 0.42,
                        cursor:      affordable ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {/* Shimmer on hover */}
                      <motion.span
                        aria-hidden
                        animate={{ x: ['-120%', '220%'] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', repeatDelay: 1.5 }}
                        style={{
                          position:      'absolute',
                          top: 0, left: 0,
                          width:         '40%', height: '100%',
                          background:    `linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)`,
                          pointerEvents: 'none',
                        }}
                      />

                      {/* Popular badge */}
                      {tier.popular && (
                        <span
                          className="absolute top-3 left-3 px-2 py-0.5 rounded-full font-black"
                          style={{ fontSize: '9px', background: 'var(--border-gold)', color: '#D4AF37' }}
                        >
                          الأشهر
                        </span>
                      )}

                      {/* Title + price */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="font-black"
                          style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}
                        >
                          {tier.label}
                        </span>
                        <span
                          className="flex items-center gap-1.5 font-black"
                          style={{ fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}
                        >
                          {tier.coins.toLocaleString('ar-TN')} <LoveCoin size={18} />
                        </span>
                      </div>

                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 10 }}>
                        {tier.desc}
                      </p>

                      {/* Perks */}
                      <div className="space-y-1.5">
                        {tier.perks.map((perk) => (
                          <div key={perk} className="flex items-center gap-2">
                            <Check size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
                            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>
                              {perk}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Insufficient balance note */}
                      {!affordable && (
                        <p className="mt-2 font-bold" style={{ fontSize: '10px', color: 'var(--color-primary)' }}>
                          رصيد غير كافٍ — تحتاج {(tier.coins - balance).toLocaleString('ar-TN')} عملة إضافية
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}

            {/* ── Confirm panel ── */}
            {confirming && selected && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.22 }}
                className="px-5 pt-3 pb-5 space-y-4"
              >
                {/* Package summary */}
                <div
                  className="rounded-[20px] p-4"
                  style={{ background: selected.accent, border: `1.5px solid ${selected.border}` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="font-black"
                      style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}
                    >
                      باقة {selected.label}
                    </span>
                    <span
                      className="flex items-center gap-1.5 font-black"
                      style={{ fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}
                    >
                      {selected.coins.toLocaleString('ar-TN')} <LoveCoin size={18} />
                    </span>
                  </div>

                  <div className="h-px" style={{ background: 'var(--glass-border)' }} />

                  <div className="mt-3 space-y-2">
                    <ConfirmRow label="الرصيد الحالي"       value={balance} />
                    <ConfirmRow label="العملات المخصومة"    value={selected.coins} isNeg />
                    <div className="h-px" style={{ background: 'var(--glass-border)' }} />
                    <ConfirmRow
                      label="الرصيد بعد الاشتراك"
                      value={balanceAfter}
                      isNeg={balanceAfter < 0}
                      isBold
                    />
                  </div>
                </div>

                {/* Meta info */}
                <div
                  className="rounded-[18px] p-4 space-y-2"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                >
                  <MetaRow icon={<Clock size={13} />}  text="مدة الاشتراك:" strong="30 يوم" />
                  <MetaRow icon={<Shield size={13} />} text="الوسيط:" strong={mediator.full_name} />
                  {!hasEnough && (
                    <MetaRow icon={<X size={13} style={{ color: 'var(--color-primary)' }} />}
                      text="رصيد غير كافٍ للمتابعة" isError />
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-2xl font-black"
                    style={{
                      background: 'var(--glass-bg)',
                      border:     '1px solid var(--glass-border)',
                      color:      'var(--text-tertiary)',
                      fontSize:   'var(--text-sm)',
                    }}
                  >
                    تغيير الباقة
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirm}
                    disabled={loading || !hasEnough}
                    className="flex-[2] py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                    style={{
                      background: hasEnough
                        ? 'linear-gradient(135deg, #800020, var(--color-primary))'
                        : 'var(--glass-bg)',
                      boxShadow: hasEnough ? '0 8px 24px var(--shadow-red-glow)' : 'none',
                      color:     hasEnough ? '#fff' : 'var(--text-tertiary)',
                      fontSize:  'var(--text-sm)',
                      opacity:   loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-t-transparent rounded-full border-white"
                      />
                    ) : (
                      <><Sparkles size={15} /> تأكيد الاشتراك</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

/* ── Internal helper ─────────────────────────────── */
function MetaRow({
  icon, text, strong, isError,
}: {
  icon: React.ReactNode; text: string; strong?: string; isError?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: isError ? 'var(--color-primary)' : 'var(--text-tertiary)' }}>
        {icon}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', color: isError ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
        {text}{' '}
        {strong && (
          <strong style={{ color: 'var(--text-main)' }}>{strong}</strong>
        )}
      </span>
    </div>
  );
}