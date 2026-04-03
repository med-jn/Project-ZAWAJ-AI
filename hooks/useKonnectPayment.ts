'use client';
/**
 * 📁 hooks/useKonnectPayment.ts — ZAWAJ AI  v2.1
 * ✅ يدعم الباقات الثابتة والشراء الحر
 * ✅ العملة مفروضة من profiles.country — لا setCurrency
 * ✅ Capacitor Browser + Supabase Realtime
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Browser }  from '@capacitor/browser';
import { App }      from '@capacitor/app';
import { supabase } from '@/lib/supabase/client';
import { toast }    from 'sonner';
import {
  ECONOMY_RULES,
  getCurrencyByCountry,
  type PackageId,
  type SupportedCurrency,
  type PurchasePayload,
} from '@/constants/ecomomy';

export type PaymentState = 'idle' | 'initiating' | 'awaiting' | 'success' | 'failed';

export function useKonnectPayment(currency: SupportedCurrency) {
  const [paymentState,    setPaymentState]    = useState<PaymentState>('idle');
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── استماع للعودة من المتصفح (deep link) ────────────────────
  useEffect(() => {
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

  // ── Realtime: مراقبة تأكيد الـ Webhook ──────────────────────
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
          Browser.close();
          cleanup();
        } else if (status === 'failed' || status === 'expired') {
          setPaymentState('failed');
          toast.error('فشل الدفع. لم يُخصم شيء من رصيدك.');
          Browser.close();
          cleanup();
        }
      })
      .subscribe();

    // مهلة احتياطية 5 دقائق
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

  // ── بدء الدفع (باقة ثابتة أو شراء حر) ──────────────────────
  const startPayment = useCallback(async (payload: PurchasePayload) => {
    setPaymentState('initiating');
    try {
      const res = await fetch('/api/payments/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, currency }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'خطأ في بدء الدفع');
      }

      const { payUrl, paymentId } = await res.json();

      setActivePaymentId(paymentId);
      setPaymentState('awaiting');

      await Browser.open({
        url: payUrl,
        windowName: '_self',
        presentationStyle: 'popover',
      });

    } catch (err) {
      console.error('[useKonnectPayment]', err);
      setPaymentState('failed');
      toast.error('فشل بدء عملية الدفع. تحقق من اتصالك وحاول مجدداً.');
    }
  }, [currency]);

  const resetPayment = useCallback(() => {
    cleanup();
    setPaymentState('idle');
  }, [cleanup]);

  return { paymentState, startPayment, resetPayment };
}