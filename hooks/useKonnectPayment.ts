'use client';
/**
 * 📁 hooks/useKonnectPayment.ts — ZAWAJ AI
 * ✅ URL ثابت للـ Edge Function — يعمل مع output:'export'
 * ✅ يرسل JWT تلقائياً
 * ✅ Capacitor Browser + Supabase Realtime
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor }  from '@capacitor/core';
import { Browser }    from '@capacitor/browser';
import { App }        from '@capacitor/app';
import { supabase }   from '@/lib/supabase/client';
import { toast }      from 'sonner';
import type { PurchasePayload, SupportedCurrency } from '@/constants/ecomomy';

export type PaymentState = 'idle' | 'initiating' | 'awaiting' | 'success' | 'failed';

const IS_NATIVE     = Capacitor.isNativePlatform();

// ✅ URL ثابت — لا يعتمد على env vars في وقت التشغيل
const EDGE_FUNC_URL = 'https://lbftmbutvtjtkxgdbndu.supabase.co/functions/v1/konnect-initiate';

export function useKonnectPayment(currency: SupportedCurrency) {
  const [paymentState,    setPaymentState]    = useState<PaymentState>('idle');
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Deep link من Konnect ──────────────────────────────────
  useEffect(() => {
    if (!IS_NATIVE) return;
    const listener = App.addListener('appUrlOpen', ({ url }) => {
      if (url.includes('/payment/success')) {
        setPaymentState('awaiting');
        toast.info('جارٍ التحقق من الدفع…');
      } else if (url.includes('/payment/fail')) {
        setPaymentState('failed');
        toast.error('تعذّر إتمام الدفع. حاول مجدداً.');
        Browser.close();
      }
    });
    return () => { listener.then(h => h.remove()); };
  }, []);

  // ── Realtime: انتظار تأكيد الـ Webhook ───────────────────
  useEffect(() => {
    if (!activePaymentId || paymentState !== 'awaiting') return;

    channelRef.current = supabase
      .channel(`payment:${activePaymentId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'konnect_payments',
        filter: `payment_id=eq.${activePaymentId}`,
      }, ({ new: row }) => {
        const status = (row as { status: string }).status;
        if (status === 'completed') {
          setPaymentState('success');
          toast.success('🎉 تم الشحن بنجاح! تمت إضافة نقاطك.');
          IS_NATIVE && Browser.close();
          cleanup();
        } else if (status === 'failed' || status === 'expired') {
          setPaymentState('failed');
          toast.error('فشل الدفع. لم يُخصم شيء من رصيدك.');
          IS_NATIVE && Browser.close();
          cleanup();
        }
      })
      .subscribe();

    const timeout = setTimeout(() => {
      if (paymentState === 'awaiting') {
        setPaymentState('failed');
        toast.error('انتهت مهلة التحقق. تواصل مع الدعم إذا تم الخصم.');
        cleanup();
      }
    }, 5 * 60_000);

    return () => { clearTimeout(timeout); cleanup(); };
  }, [activePaymentId, paymentState]);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setActivePaymentId(null);
  }, []);

  // ── بدء الدفع ────────────────────────────────────────────
  const startPayment = useCallback(async (payload: PurchasePayload) => {
    setPaymentState('initiating');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('غير مسجّل الدخول');

      const res = await fetch(EDGE_FUNC_URL, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...payload, currency }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const { payUrl, paymentId } = await res.json();
      setActivePaymentId(paymentId);
      setPaymentState('awaiting');

      if (IS_NATIVE) {
        await Browser.open({
          url: payUrl,
          windowName: '_self',
          presentationStyle: 'popover',
        });
      } else {
        window.open(payUrl, '_blank');
      }

    } catch (err: any) {
      console.error('[useKonnectPayment]', err);
      setPaymentState('failed');
      toast.error(`فشل بدء عملية الدفع: ${err.message ?? 'تحقق من اتصالك'}`);
    }
  }, [currency]);

  const resetPayment = useCallback(() => {
    cleanup();
    setPaymentState('idle');
  }, [cleanup]);

  return { paymentState, startPayment, resetPayment };
}