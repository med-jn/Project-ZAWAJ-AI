'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

// تعريف الواجهة بناءً على هيكل الجداول الأخير
interface Wallet {
  id: string;
  balance: number;       // النقاط المدفوعة (حسب ملفك)
  balance_free: number;  // النقاط المجانية (التي أضفناها)
  last_daily_reward: string | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  // دالة جلب البيانات (Memoized لضمان الأداء)
  const fetchWallet = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('wallets')
      .select('id, balance, balance_free, last_daily_reward')
      .eq('id', user.id) // في ملفك id المحفظة هو نفسه user_id
      .single();

    if (!error && data) {
      setWallet(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWallet();

    // تفعيل التحديث اللحظي (Real-time) 
    // إذا تغير الرصيد في قاعدة البيانات، يتحدث في واجهة المستخدم فوراً
    const walletSubscription = supabase
      .channel('wallet_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'wallets' }, 
        (payload) => {
          setWallet(payload.new as Wallet);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletSubscription);
    };
  }, [fetchWallet]);

  // حساب الرصيد الإجمالي
  const totalBalance = wallet 
    ? (wallet.balance || 0) + (wallet.balance_free || 0) 
    : 0;

  return { 
    wallet, 
    totalBalance, 
    loading, 
    refreshWallet: fetchWallet // للسماح بتحديث الرصيد يدوياً عند فتح السايد بار
  };
}