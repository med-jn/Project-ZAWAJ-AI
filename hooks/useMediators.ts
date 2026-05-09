'use client';
import { useState, useCallback } from 'react';
import { toast }                  from 'sonner';
import { supabase }               from '@/lib/supabase/client';
import type { MediatorRow, Subscriber, CurrentUser } from '@/components/mediators/types';

export interface UseMediatorsReturn {
  mediators:      MediatorRow[];
  loading:        boolean;
  currentUser:    CurrentUser | null;
  balance:        number;
  subscribers:    Subscriber[];
  subLoading:     boolean;
  load:           () => Promise<void>;
  openMediator:   (m: MediatorRow) => Promise<void>;
  submitRating:   (id: string, rating: number, comment: string) => Promise<void>;
  reportMediator: (id: string) => Promise<void>;
  unsubscribe:    (m: MediatorRow) => Promise<boolean>;
}

export function useMediators(): UseMediatorsReturn {
  const [mediators,   setMediators]   = useState<MediatorRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [balance,     setBalance]     = useState(0);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subLoading,  setSubLoading]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let me: CurrentUser | null = null;

    if (user) {
      const [p, w] = await Promise.all([
        supabase.from('profiles').select('id,full_name,gender,mediator_id').eq('id', user.id).single(),
        supabase.from('wallets').select('balance').eq('id', user.id).single(),
      ]);
      if (p.data) me = p.data as CurrentUser;
      setBalance(w.data?.balance ?? 0);
    }
    setCurrentUser(me);

    const { data, error } = await supabase.rpc('get_mediators');
    if (error) { console.error('[useMediators]', error.message); setLoading(false); return; }

    const rows: MediatorRow[] = (data ?? []).map((m: any) => ({
      ...m,
      avg_rating:        Number(m.avg_rating        ?? 0),
      total_subscribers: Number(m.total_subscribers ?? 0), // ← من الـ RPC مباشرة
      isSubscribed:      me?.mediator_id === m.id,
    }));

    rows.sort((a, b) => b.avg_rating - a.avg_rating);
    setMediators(rows);
    setLoading(false);
  }, []);

  const openMediator = useCallback(async (m: MediatorRow) => {
    setSubLoading(true); setSubscribers([]);
    const opp = currentUser?.gender === 'male' ? 'female' : 'male';
    const { data } = await supabase.from('profiles')
      .select('id,full_name,avatar_url,age,city,gender,profile_completion_percent')
      .eq('mediator_id', m.id).eq('gender', opp);
    setSubscribers(data ?? []); setSubLoading(false);
  }, [currentUser?.gender]);

  const submitRating = useCallback(async (mediatorId: string, rating: number, comment: string) => {
    if (!currentUser || rating === 0) return;
    const { error } = await supabase.from('mediator_reviews').upsert(
      { mediator_id: mediatorId, id: currentUser.id, rating, comment: comment || null },
      { onConflict: 'mediator_id,id' },
    );
    if (error) { toast.error('فشل إرسال التقييم'); return; }
    toast.success('تم إرسال التقييم'); await load();
  }, [currentUser, load]);

  const reportMediator = useCallback(async (mediatorId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('reports')
      .insert({ reporter_id: currentUser.id, reported_id: mediatorId, reason: 'بلاغ عن وسيط' });
    if (error) { toast.error('فشل إرسال البلاغ'); return; }
    toast.success('تم إرسال البلاغ');
  }, [currentUser]);

  const unsubscribe = useCallback(async (mediator: MediatorRow): Promise<boolean> => {
    if (!currentUser) return false;
    const now = new Date().toISOString();
    try {
      await Promise.all([
        supabase.from('profiles').update({ mediator_id: null, updated_at: now }).eq('id', currentUser.id),
        supabase.from('mediator_clients').update({ status: 'cancelled' })
          .eq('user_id', currentUser.id).eq('mediator_id', mediator.id).eq('status', 'active'),
        supabase.from('mediator_subscriptions').update({ status: 'cancelled' })
          .eq('id', currentUser.id).eq('mediator_id', mediator.id).eq('status', 'active'),
      ]);
      await supabase.from('point_transactions').insert({
        user_id: currentUser.id, mediator_id: mediator.id,
        amount: 0, balance_after: 0, action: 'unsubscription', source: 'subscription',
        user_name: currentUser.full_name ?? 'مستخدم',
        notes: `إلغاء الاشتراك مع الوسيط ${mediator.full_name}`,
      });
      toast.success('تم إلغاء الاشتراك بنجاح'); await load(); return true;
    } catch (e) { console.error(e); toast.error('حدث خطأ، حاول مرة أخرى'); return false; }
  }, [currentUser, load]);

  return { mediators, loading, currentUser, balance, subscribers, subLoading,
    load, openMediator, submitRating, reportMediator, unsubscribe };
}