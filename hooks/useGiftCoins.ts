'use client';
/**
 * 📁 hooks/useGiftCoins.ts — ZAWAJ AI
 *
 * ✅ مراقبة realtime للرصيد — دائماً محدّث في الذاكرة
 * ✅ canAfford() للتحقق المحلي الفوري قبل أي تفاعل
 * ✅ deduct() optimistic — يحدّث الواجهة فوراً ويتراجع عند الفشل
 * ✅ deductBackground() للخلفية (view) — لا يوقف التنفيذ
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

const COSTS: Record<string, number> = {
  like:    5,
  pass:    1,
  view:    1,
  message: 10,
};

export interface DeductParams {
  action:     'like' | 'pass' | 'view' | 'message';
  target_id?: string;
  notes?:     string;
}

export function useGiftCoins() {
  const [balance, setBalance] = useState<number | null>(null);
  const balanceRef = useRef<number | null>(null);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  // ── جلب الرصيد الأولي + مراقبة realtime ──────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { data } = await supabase
        .from('wallets')
        .select('balance_free')
        .eq('id', user.id)
        .single();

      if (mounted && data) setBalance(data.balance_free ?? 0);

      // مراقبة realtime على جدول wallets
      channel = supabase
        .channel(`wallet_${user.id}`)
        .on(
          'postgres_changes',
          {
            event:  'UPDATE',
            schema: 'public',
            table:  'wallets',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            const newBal = payload.new?.balance_free ?? 0;
            if (mounted) setBalance(newBal);
          }
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // ── تحقق محلي فوري ────────────────────────────────────────
  const canAfford = useCallback((action: DeductParams['action']): boolean => {
    const cost = COSTS[action] ?? 0;
    const bal  = balanceRef.current;
    if (bal === null) return true; // لم يُحمَّل بعد → نسمح والخادم يقرر
    return bal >= cost;
  }, []);

  // ── خصم optimistic ────────────────────────────────────────
  const deduct = useCallback(async (params: DeductParams): Promise<boolean> => {
    const cost = COSTS[params.action] ?? 0;

    // تحديث محلي فوري
    setBalance(prev => (prev !== null ? prev - cost : null));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setBalance(prev => (prev !== null ? prev + cost : null));
        return false;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/deduct-gift-coins`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(params),
        }
      );

      const result = await res.json();

      if (!result.success) {
        // تراجع عن التحديث المحلي
        setBalance(prev => (prev !== null ? prev + cost : null));
        if (result.error === 'insufficient_balance') {
          showInsufficientToast(params.action, result.balance_free ?? 0, cost);
        }
        return false;
      }

      // تأكيد الرصيد الحقيقي
      setBalance(result.balance_free);
      return true;

    } catch (err) {
      setBalance(prev => (prev !== null ? prev + cost : null));
      console.error('[useGiftCoins]', err);
      return false;
    }
  }, []);

  // ── خصم في الخلفية بدون انتظار (للـ view) ────────────────
  const deductBackground = useCallback((params: DeductParams) => {
    deduct(params).catch(() => {});
  }, [deduct]);

  return { deduct, deductBackground, canAfford, balance };
}

// ── رسائل Sonner ──────────────────────────────────────────────
const MESSAGES: Record<string, string> = {
  like:    'نقاطك لا تكفي للإعجاب',
  pass:    'نقاطك لا تكفي للتخطي',
  view:    'نقاطك لا تكفي لفتح الملف',
  message: 'نقاطك لا تكفي لإرسال رسالة',
};

function showInsufficientToast(action: string, balance: number, cost: number) {
  toast.error(MESSAGES[action] ?? 'رصيد غير كافٍ', {
    description: `تحتاج ${cost} نقاط — رصيدك: ${balance}`,
    action: {
      label:   'اكسب نقاط',
      onClick: () => { window.location.href = '/points'; },
    },
    duration: 4000,
  });
}