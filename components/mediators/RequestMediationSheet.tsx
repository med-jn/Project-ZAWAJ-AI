'use client';
/**
 * components/mediators/RequestMediationSheet.tsx
 * ✅ يستدعي RPC request_mediation مباشرة
 * ✅ بدون عملات أو أسعار
 * ✅ tier='pending' → يُحوَّل إلى active عند الدفع على الموقع
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence }                   from 'framer-motion';
import { X, ShieldCheck, Send, Clock, CheckCircle2 } from 'lucide-react';
import { supabase }                                  from '@/lib/supabase/client';
import { toast }                                     from 'sonner';
import { Icon }                                      from './Icon';
import type { MediatorRow }                          from './types';

function Spinner({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
      style={{
        display: 'inline-block', width: size, height: size,
        border: `2px solid rgba(255,255,255,0.25)`,
        borderTopColor: color, borderRadius: '50%',
      }}
    />
  );
}

interface Props {
  mediator:  MediatorRow;
  userName:  string;
  onClose:   () => void;
  onSuccess: () => void;
}

export function RequestMediationSheet({ mediator, userName, onClose, onSuccess }: Props) {
  const [message,  setMessage]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const closeBtnRef             = useRef<HTMLButtonElement>(null);

  useEffect(() => { closeBtnRef.current?.focus(); }, []);

  const onKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose(); },
    [loading, onClose],
  );
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  const handleSend = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('يجب تسجيل الدخول أولاً'); setLoading(false); return; }

      // استدعاء الدالة المُنشأة في Supabase
      // تُنشئ سجل mediator_subscriptions بـ tier='pending' + إشعار للوسيط
      const { error } = await supabase.rpc('request_mediation', {
        p_user_id:     session.user.id,
        p_mediator_id: mediator.id,
        p_message:     message.trim() || null,
      });

      if (error) {
        // لو كان السجل موجوداً بالفعل (ON CONFLICT DO NOTHING) نعتبره نجاحاً
        if (error.code !== '23505') {
          toast.error('حدث خطأ، حاول مرة أخرى');
          setLoading(false);
          return;
        }
      }

      setSent(true);
      setTimeout(() => { onSuccess(); }, 2200);
    } catch {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500]"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)' }}
        onClick={() => !loading && onClose()}
      />

      {/* Sheet */}
      <motion.div
        role="dialog" aria-modal="true" dir="rtl"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-[510] rounded-t-[32px] flex flex-col"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', maxHeight: '85vh' }}
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
                : <div className="w-full h-full flex items-center justify-center icon-wrap"
                    style={{ background: 'var(--bg-soft)' }}>
                    <Icon i={ShieldCheck} size={20} color="var(--text-tertiary)" />
                  </div>}
            </div>
            <div>
              <p className="font-black" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)' }}>
                طلب وساطة
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {mediator.full_name}
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center icon-wrap"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            <Icon i={X} size={15} color="var(--text-tertiary)" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <AnimatePresence mode="wait">

            {/* ── نجاح ── */}
            {sent && (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                >
                  <Icon i={CheckCircle2} size={64} color="#22c55e" />
                </motion.div>
                <p className="font-black text-center"
                  style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
                  تم إرسال طلبك بنجاح!
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  سيتواصل معك الوسيط {mediator.full_name} قريباً لإتمام الإجراءات
                </p>
              </motion.div>
            )}

            {/* ── نموذج ── */}
            {!sent && (
              <motion.div key="form"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* شرح */}
                <div className="rounded-[18px] p-4 space-y-2.5"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                  <div className="flex items-start gap-2 icon-wrap">
                    <Icon i={ShieldCheck} size={14} color="var(--color-primary)" />
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      سيتلقى الوسيط طلبك ويتواصل معك لمتابعة الإجراءات
                    </p>
                  </div>
                  <div className="flex items-start gap-2 icon-wrap">
                    <Icon i={Clock} size={14} color="var(--text-tertiary)" />
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                      عادةً ما يستجيب الوسطاء خلال 24 ساعة
                    </p>
                  </div>
                </div>

                {/* رسالة اختيارية */}
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 8 }}>
                    رسالة للوسيط (اختياري)
                  </p>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="أخبر الوسيط عن نفسك أو ما تبحث عنه..."
                    rows={4}
                    maxLength={300}
                    className="w-full rounded-2xl px-4 py-3 outline-none resize-none"
                    style={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-main)',
                      fontFamily: 'inherit',
                      fontSize: 'var(--text-sm)',
                      lineHeight: 1.6,
                    }}
                  />
                  <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textAlign: 'left', marginTop: 4 }}>
                    {message.length}/300
                  </p>
                </div>

                {/* زر الإرسال */}
                <div style={{ paddingBottom: 'var(--nav-h-safe)' }}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSend}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 icon-wrap"
                    style={{
                      background: 'linear-gradient(135deg, #800020, var(--color-primary))',
                      boxShadow: '0 8px 24px var(--shadow-red-glow)',
                      fontSize: 'var(--text-sm)',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? <Spinner /> : <><Icon i={Send} size={15} color="#fff" /> إرسال طلب الوساطة</>}
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