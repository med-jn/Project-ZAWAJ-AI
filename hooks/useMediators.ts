'use client';
/**
 * hooks/useMediators.ts
 *
 * Central custom hook for the Mediators feature.
 * Encapsulates all async logic so page.tsx is purely presentational.
 *
 * Responsibilities:
 *  - Fetch mediators list (RPC)
 *  - Fetch current user profile + wallet balance
 *  - Fetch subscribers for a selected mediator
 *  - Submit a rating
 *  - Submit a report
 *  - Unsubscribe
 */

import { useState, useCallback } from 'react';
import { toast }                  from 'sonner';
import { supabase }               from '@/lib/supabase/client';
import type { MediatorRow, Subscriber, CurrentUser } from '@/components/mediators/types';

/* ── Return shape ───────────────────────────────────── */
export interface UseMediatorsReturn {
  /* State */
  mediators:   MediatorRow[];
  loading:     boolean;
  currentUser: CurrentUser | null;
  balance:     number;
  subscribers: Subscriber[];
  subLoading:  boolean;

  /* Actions */
  load:           () => Promise<void>;
  openMediator:   (m: MediatorRow) => Promise<void>;
  submitRating:   (mediatorId: string, rating: number, comment: string) => Promise<void>;
  reportMediator: (mediatorId: string) => Promise<void>;
  unsubscribe:    (mediator: MediatorRow) => Promise<boolean>;
}

/* ── Hook ───────────────────────────────────────────── */
export function useMediators(): UseMediatorsReturn {
  const [mediators,   setMediators]   = useState<MediatorRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [balance,     setBalance]     = useState(0);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subLoading,  setSubLoading]  = useState(false);

  /* ── load ─────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    let myProfile: CurrentUser | null = null;

    if (user) {
      const [profileRes, walletRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, gender, mediator_id')
          .eq('id', user.id)
          .single(),
        supabase
          .from('wallets')
          .select('balance')
          .eq('id', user.id)
          .single(),
      ]);

      if (profileRes.data) myProfile = profileRes.data as CurrentUser;
      setBalance(walletRes.data?.balance ?? 0);
    }

    setCurrentUser(myProfile);

    const { data, error } = await supabase.rpc('get_mediators');

    if (error) {
      console.error('[useMediators] get_mediators:', error.message);
      setLoading(false);
      return;
    }

    const rows: MediatorRow[] = (data ?? []).map((m: any) => ({
      ...m,
      avg_rating:   Number(m.avg_rating ?? 0),
      isSubscribed: myProfile?.mediator_id === m.id,
    }));

    rows.sort((a, b) => b.avg_rating - a.avg_rating);
    setMediators(rows);
    setLoading(false);
  }, []);

  /* ── openMediator ─────────────────────────────────── */
  const openMediator = useCallback(async (m: MediatorRow) => {
    setSubLoading(true);
    setSubscribers([]);

    const oppGender = currentUser?.gender === 'male' ? 'female' : 'male';

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, age, city, gender, profile_completion_percent')
      .eq('mediator_id', m.id)
      .eq('gender', oppGender);

    setSubscribers(data ?? []);
    setSubLoading(false);
  }, [currentUser?.gender]);

  /* ── submitRating ─────────────────────────────────── */
  const submitRating = useCallback(async (
    mediatorId: string,
    rating:     number,
    comment:    string,
  ) => {
    if (!currentUser || rating === 0) return;

    const { error } = await supabase
      .from('mediator_reviews')
      .upsert(
        {
          mediator_id: mediatorId,
          id:          currentUser.id,
          rating,
          comment:     comment || null,
        },
        { onConflict: 'mediator_id,id' },
      );

    if (error) {
      toast.error('فشل إرسال التقييم');
      return;
    }

    toast.success('تم إرسال التقييم');
    await load();
  }, [currentUser, load]);

  /* ── reportMediator ───────────────────────────────── */
  const reportMediator = useCallback(async (mediatorId: string) => {
    if (!currentUser) return;

    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUser.id,
      reported_id: mediatorId,
      reason:      'بلاغ عن وسيط',
    });

    if (error) {
      toast.error('فشل إرسال البلاغ');
      return;
    }

    toast.success('تم إرسال البلاغ');
  }, [currentUser]);

  /* ── unsubscribe ──────────────────────────────────── */
  const unsubscribe = useCallback(async (mediator: MediatorRow): Promise<boolean> => {
    if (!currentUser) return false;

    const now = new Date().toISOString();

    try {
      const [r1, r2, r3] = await Promise.all([
        supabase
          .from('profiles')
          .update({ mediator_id: null, updated_at: now })
          .eq('id', currentUser.id),

        supabase
          .from('mediator_clients')
          .update({ status: 'cancelled' })
          .eq('user_id',     currentUser.id)
          .eq('mediator_id', mediator.id)
          .eq('status',      'active'),

        supabase
          .from('mediator_subscriptions')
          .update({ status: 'cancelled' })
          .eq('id',          currentUser.id)
          .eq('mediator_id', mediator.id)
          .eq('status',      'active'),
      ]);

      /* Log partial failures — don't block the user */
      [r1, r2, r3].forEach((r, i) => {
        if (r.error) console.warn(`[unsubscribe] step${i + 1}:`, r.error.message);
      });

      /* Audit trail */
      await supabase.from('point_transactions').insert({
        user_id:       currentUser.id,
        mediator_id:   mediator.id,
        amount:        0,
        balance_after: 0,
        action:        'unsubscription',
        source:        'subscription',
        user_name:     currentUser.full_name ?? 'مستخدم',
        notes:         `إلغاء الاشتراك مع الوسيط ${mediator.full_name}`,
      });

      toast.success('تم إلغاء الاشتراك بنجاح');
      await load();
      return true;
    } catch (e) {
      console.error('[unsubscribe]', e);
      toast.error('حدث خطأ، حاول مرة أخرى');
      return false;
    }
  }, [currentUser, load]);

  /* ── Return ─────────────────────────────────────── */
  return {
    mediators,
    loading,
    currentUser,
    balance,
    subscribers,
    subLoading,
    load,
    openMediator,
    submitRating,
    reportMediator,
    unsubscribe,
  };
}