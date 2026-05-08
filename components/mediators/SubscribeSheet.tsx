'use client';
/**
 * components/mediators/SubscribeSheet.tsx
 * Bottom sheet: اختيار الباقة → تأكيد → API
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence }                   from 'framer-motion';
import { supabase }                                  from '@/lib/supabase/client';
import { LoveCoin }                                  from '@/components/ui/LoveCoin';
import { toast }                                     from 'sonner';
import { ConfirmRow }                                from './ConfirmRow';
import { TIERS }                                     from './constants';
import type { Tier }                                 from './constants';
import type { MediatorRow, SuccessData }             from './types';

/* ── SVG icons (تجاوز fill:none) ─────── */
function XIcon({ size = 15, color = 'var(--text-tertiary)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <line x1="18" y1="6"  x2="6"  y2="18" style={{ stroke: color, strokeWidth: '2px', strokeLinecap: 'round' }} />
      <line x1="6"  y1="6"  x2="18" y2="18" style={{ stroke: color, strokeWidth: '2px', strokeLinecap: 'round' }} />
    </svg>
  );
}

function CheckIcon({ size = 12, color = '#22c55e' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block', flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12"
        style={{ fill: 'none', stroke: color, strokeWidth: '2.5px', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
    </svg>
  );
}

function SpinnerIcon({ size = 16 }: { size?: number }) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
      style={{ display: 'inline-block', width: size, height: size,
        border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
        borderRadius: '50%' }}
    />
  );
}

/* ── MetaRow helper ───────────────────── */
function MetaRow({ icon, text, strong, isError }: { icon: React.ReactNode; text: string; strong?: string; isError?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: isError ? 'var(--color-primary)' : 'var(--text-tertiary)', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 'var(--text-xs)', color: isError ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
        {text}{strong && <strong style={{ color: 'var(--text-main)' }}> {strong}</strong>}
      </span>
    </div>
  );
}

function ClockIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="10" style={{ fill: 'none', stroke: 'var(--text-tertiary)', strokeWidth: '2px' }} />
      <polyline points="12 6 12 12 16 14" style={{ fill: 'none', stroke: 'var(--text-tertiary)', strokeWidth: '2px', strokeLinecap: 'round' }} />
    </svg>
  );
}

function ShieldIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block' }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        style={{ fill: 'none', stroke: 'var(--text-tertiary)', strokeWidth: '2px', strokeLinejoin: 'round' }} />
    </svg>
  );
}

/* ── Props ────────────────────────────── */
interface SubscribeSheetProps {
  mediator:  MediatorRow;
  balance:   number;
  userName:  string;
  onClose:   () => void;
  onSuccess: (d: SuccessData) => void;
}

export function SubscribeSheet({ mediator, balance, userName, onClose, onSuccess }: SubscribeSheetProps) {
  const [selected,   setSelected]   = useState<Tier | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const closeBtnRef                 = useRef<HTMLButtonElement>(null);

  useEffect(() => { closeBtnRef.current?.focus(); }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) onClose();
  }, [loading, onClose]);
  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/subscribe-to-mediator`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ mediator_id: mediator.id, coins: selected.coins }),
        },
      );
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'فشل الاشتراك'); return; }
      onSuccess({
        mediatorName: mediator.full_name,
        userName,
        coins:        selected.coins,
        subscribedAt: new Date(),
        expiresAt:    new Date(json.expires_at),
      });
    } catch { toast.error('حدث خطأ غير متوقع'); }
    finally   { setLoading(false); }
  };

  const balanceAfter = balance - (selected?.coins ?? 0);
  const hasEnough    = balanceAfter >= 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div aria-hidden
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500]"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)' }}
        onClick={() => !loading && onClose()}
      />

      {/* Sheet */}
      <motion.div
        role="dialog" aria-modal="true" aria-label={`اشتراك مع ${mediator.full_name}`} dir="rtl"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-[510] rounded-t-[32px] flex flex-col"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--glass-border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--glass-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden"
              style={{ border: '1.5px solid var(--border-gold)' }}>
              {mediator.avatar_url
                ? <img src={mediator.avatar_url} alt={mediator.full_name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'var(--bg-soft)' }}>🤝</div>}
            </div>
            <div>
              <p className="font-black" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                اشتراك مع {mediator.full_name}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>اختر الباقة المناسبة</p>
            </div>
          </div>
          <button ref={closeBtnRef} onClick={() => !loading && onClose()} disabled={loading} aria-label="إغلاق"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <XIcon />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Balance bar */}
          <div className="mx-5 mt-4 mb-3 px-4 py-3 rounded-[16px] flex items-center justify-between"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>رصيدك الحالي</span>
            <span className="flex items-center gap-1.5 font-black"
              style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
              {balance.toLocaleString('ar-TN')} <LoveCoin size={16} />
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Tier list ── */}
            {!confirming && (
              <motion.div key="tiers"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                className="px-5 pb-5 space-y-3">
                {TIERS.map((tier, idx) => {
                  const ok = balance >= tier.coins;
                  return (
                    <motion.button key={tier.coins}
                      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      whileHover={ok ? { scale: 1.015 } : {}}
                      whileTap={ok  ? { scale: 0.98  } : {}}
                      onClick={() => { if (!ok) return; setSelected(tier); setConfirming(true); }}
                      disabled={!ok}
                      className="w-full text-right rounded-[22px] p-4 relative overflow-hidden"
                      style={{ background: tier.accent, border: `1.5px solid ${tier.border}`,
                        boxShadow: ok ? `0 4px 22px ${tier.glow}` : 'none',
                        opacity: ok ? 1 : 0.42, cursor: ok ? 'pointer' : 'not-allowed' }}>

                      {/* Shimmer */}
                      <motion.span aria-hidden
                        animate={{ x: ['-120%', '220%'] }}
                        transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut', repeatDelay: 1.6 }}
                        style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.055), transparent)',
                          pointerEvents: 'none' }}
                      />

                      {tier.popular && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full font-black"
                          style={{ fontSize: '9px', background: 'var(--border-gold)', color: '#D4AF37' }}>
                          الأشهر
                        </span>
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black" style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
                          {tier.label}
                        </span>
                        <span className="flex items-center gap-1.5 font-black"
                          style={{ fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}>
                          {tier.coins.toLocaleString('ar-TN')} <LoveCoin size={18} />
                        </span>
                      </div>

                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 10 }}>
                        {tier.desc}
                      </p>

                      <div className="space-y-1.5">
                        {tier.perks.map(p => (
                          <div key={p} className="flex items-center gap-2">
                            <CheckIcon /><span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>{p}</span>
                          </div>
                        ))}
                      </div>

                      {!ok && (
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
              <motion.div key="confirm"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
                className="px-5 pt-3 pb-5 space-y-4">

                <div className="rounded-[20px] p-4"
                  style={{ background: selected.accent, border: `1.5px solid ${selected.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black" style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
                      باقة {selected.label}
                    </span>
                    <span className="flex items-center gap-1.5 font-black"
                      style={{ fontSize: 'var(--text-lg)', color: 'var(--text-main)' }}>
                      {selected.coins.toLocaleString('ar-TN')} <LoveCoin size={18} />
                    </span>
                  </div>
                  <div className="h-px" style={{ background: 'var(--glass-border)' }} />
                  <div className="mt-3 space-y-2">
                    <ConfirmRow label="الرصيد الحالي"        value={balance} />
                    <ConfirmRow label="العملات المخصومة"     value={selected.coins} isNeg />
                    <div className="h-px" style={{ background: 'var(--glass-border)' }} />
                    <ConfirmRow label="الرصيد بعد الاشتراك" value={balanceAfter} isNeg={balanceAfter < 0} isBold />
                  </div>
                </div>

                <div className="rounded-[18px] p-4 space-y-2"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                  <MetaRow icon={<ClockIcon />}  text="مدة الاشتراك:" strong="30 يوم" />
                  <MetaRow icon={<ShieldIcon />} text="الوسيط:"       strong={mediator.full_name} />
                  {!hasEnough && <MetaRow icon={<XIcon size={13} color="var(--color-primary)" />} text="رصيد غير كافٍ للمتابعة" isError />}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setConfirming(false)} disabled={loading}
                    className="flex-1 py-3.5 rounded-2xl font-black"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                      color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                    تغيير الباقة
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={handleConfirm} disabled={loading || !hasEnough}
                    className="flex-[2] py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                    style={{
                      background: hasEnough ? 'linear-gradient(135deg, #800020, var(--color-primary))' : 'var(--glass-bg)',
                      boxShadow:  hasEnough ? '0 8px 24px var(--shadow-red-glow)' : 'none',
                      color:      hasEnough ? '#fff' : 'var(--text-tertiary)',
                      fontSize:   'var(--text-sm)', opacity: loading ? 0.7 : 1,
                    }}>
                    {loading ? <SpinnerIcon /> : <>✨ تأكيد الاشتراك</>}
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