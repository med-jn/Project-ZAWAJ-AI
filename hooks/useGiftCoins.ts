'use client';
/**
 * 📁 hooks/useGiftCoins.ts — ZAWAJ AI
 *
 * Hook مركزي لخصم نقاط الهدايا عبر Edge Function.
 * يستخدم في:
 *   - usercard.tsx   (like, pass, view)
 *   - view/page.tsx  (view, message)
 *   - ProfileActions عبر view/page.tsx (like)
 *
 * الاستخدام:
 *   const { deduct, balance, loading } = useGiftCoins();
 *   const ok = await deduct({ action: 'like', target_id: '...' });
 *   if (!ok) return; // نقاط غير كافية — Sonner ظهر تلقائياً
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

// ── رسائل الخطأ للمستخدم ──────────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  like:    'نقاطك لا تكفي للإعجاب — اكسب المزيد من المكافآت!',
  pass:    'نقاطك لا تكفي للتخطي — اكسب المزيد من المكافآت!',
  view:    'نقاطك لا تكفي لفتح الملف — اكسب المزيد من المكافآت!',
  message: 'نقاطك لا تكفي لإرسال رسالة — اكسب المزيد من المكافآت!',
};

export interface DeductParams {
  action:     'like' | 'pass' | 'view' | 'message';
  target_id?: string;
  notes?:     string;
}

export interface DeductResult {
  success:      boolean;
  balance_free?: number;
  error?:       string;
}

export function useGiftCoins() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // ── جلب الرصيد الأولي ────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('wallets')
        .select('balance_free')
        .eq('id', user.id)
        .single();
      if (mounted && data) setBalance(data.balance_free ?? 0);
    })();
    return () => { mounted = false; };
  }, []);

  // ── الدالة الرئيسية: خصم النقاط ──────────────────────────
  const deduct = useCallback(async (params: DeductParams): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('يجب تسجيل الدخول أولاً');
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

      const result: DeductResult = await res.json();

      if (!result.success) {
        if (result.error === 'insufficient_balance') {
          // رسالة Sonner مخصصة لكل نوع تفاعل
          toast.error(ERROR_MESSAGES[params.action] ?? 'نقاطك غير كافية', {
            description: `تحتاج ${getCost(params.action)} نقاط — رصيدك الحالي: ${result.balance_free ?? 0}`,
            action: {
              label: 'اكسب نقاط',
              onClick: () => {
                // الانتقال لصفحة النقاط
                window.location.href = '/points';
              },
            },
            duration: 4000,
          });
        } else {
          console.error('[useGiftCoins] error:', result.error);
        }
        return false;
      }

      // تحديث الرصيد المحلي فوراً بعد النجاح
      if (result.balance_free !== undefined) {
        setBalance(result.balance_free);
      }

      return true;

    } catch (err) {
      console.error('[useGiftCoins] fetch error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deduct, balance, loading };
}

// ── helper: تكلفة كل action ──────────────────────────────────
function getCost(action: string): number {
  const costs: Record<string, number> = {
    like: 5, pass: 1, view: 1, message: 10,
  };
  return costs[action] ?? 0;
}
