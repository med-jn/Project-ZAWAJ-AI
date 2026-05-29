'use client';
/**
 * hooks/useMediators.ts — ZAWAJ AI
 * ✅ isSubscribed يشمل tier='pending' و status='active'
 * ✅ حُذف balance تماماً
 */

import { useState, useCallback, useRef } from 'react';
import { toast }                          from 'sonner';
import { supabase }                       from '@/lib/supabase/client';
import type { MediatorRow, Subscriber, CurrentUser } from '@/components/mediators/types';

export interface UseMediatorsReturn {
  mediators:        MediatorRow[];
  loading:          boolean;
  currentUser:      CurrentUser | null;
  subscribers:      Subscriber[];
  subLoading:       boolean;
  load:             () => Promise<void>;
  openMediator:     (m: MediatorRow) => Promise<void>;
  submitRating:     (id: string, rating: number, comment: string) => Promise<void>;
  reportMediator:   (id: string) => Promise<void>;
  unsubscribe:      (m: MediatorRow) => Promise<boolean>;
  markSubscribed:   (mediatorId: string) => void;
  markUnsubscribed: (mediatorId: string) => void;
}

export function useMediators(): UseMediatorsReturn {
  const [mediators,   setMediators]   = useState<MediatorRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subLoading,  setSubLoading]  = useState(false);

  // معرّفات الوسطاء الذين لدى المستخدم طلب معهم (pending أو active)
  const activeSubIds = useRef<Set<string>>(new Set());

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let me: CurrentUser | null = null;

    if (user) {
      const [p, subs] = await Promise.all([
        supabase.from('profiles')
          .select('id,full_name,gender,mediator_id')
          .eq('id', user.id).single(),

        // ✅ نجلب كل السجلات — pending (طلب من التطبيق) و active (مفعّل من الموقع)
        supabase.from('mediator_subscriptions')
          .select('mediator_id, tier, status')
          .eq('id', user.id)
          .or('status.eq.pending,and(status.eq.active,expires_at.gt.' + new Date().toISOString() + ')'),
      ]);

      if (p.data) me = p.data as CurrentUser;

      activeSubIds.current = new Set(
        (subs.data ?? []).map((s: { mediator_id: string }) => s.mediator_id)
      );
    }
    setCurrentUser(me);

    const { data, error } = await supabase.rpc('get_mediators');
    if (error) { console.error('[useMediators]', error.message); setLoading(false); return; }

    const rows: MediatorRow[] = (data ?? []).map((m: any) => ({
      ...m,
      avg_rating:        Number(m.avg_rating        ?? 0),
      total_subscribers: Number(m.total_subscribers ?? 0),
      isSubscribed:      activeSubIds.current.has(m.id),
    }));

    rows.sort((a, b) => b.avg_rating - a.avg_rating);
    setMediators(rows);
    setLoading(false);
  }, []);

  /* ── optimistic toggles ── */
  const markSubscribed = useCallback((mediatorId: string) => {
    activeSubIds.current.add(mediatorId);
    setMediators(prev => prev.map(m => m.id === mediatorId ? { ...m, isSubscribed: true } : m));
  }, []);

  const markUnsubscribed = useCallback((mediatorId: string) => {
    activeSubIds.current.delete(mediatorId);
    setMediators(prev => prev.map(m => m.id === mediatorId ? { ...m, isSubscribed: false } : m));
  }, []);

  /* ── openMediator ── */
  const openMediator = useCallback(async (m: MediatorRow) => {
    if (!currentUser) return;
    setSubLoading(true); setSubscribers([]);

    const oppGender = currentUser.gender === 'male' ? 'female' : 'male';

    // نجلب الأعضاء النشطين فقط (status=active) للعرض
    const { data: activeSubs } = await supabase
      .from('mediator_subscriptions')
      .select('id')
      .eq('mediator_id', m.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    const subUserIds = (activeSubs ?? []).map((s: { id: string }) => s.id);

    if (subUserIds.length === 0) { setSubscribers([]); setSubLoading(false); return; }

    const { data } = await supabase
      .from('profiles')
      .select('id,full_name,avatar_url,age,city,gender,profile_completion_percent')
      .in('id', subUserIds)
      .eq('gender', oppGender);

    setSubscribers(data ?? []);
    setSubLoading(false);
  }, [currentUser]);

  /* ── submitRating ── */
  const submitRating = useCallback(async (
    mediatorId: string, rating: number, comment: string
  ) => {
    if (!currentUser || rating === 0) return;
    const { error } = await supabase.from('mediator_reviews').upsert(
      { mediator_id: mediatorId, id: currentUser.id, rating, comment: comment || null },
      { onConflict: 'mediator_id,id' },
    );
    if (error) { toast.error('فشل إرسال التقييم'); return; }
    toast.success('تم إرسال التقييم');
    await load();
  }, [currentUser, load]);

  /* ── reportMediator ── */
  const reportMediator = useCallback(async (mediatorId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('reports')
      .insert({ reporter_id: currentUser.id, reported_id: mediatorId, reason: 'بلاغ عن وسيط' });
    if (error) { toast.error('فشل إرسال البلاغ'); return; }
    toast.success('تم إرسال البلاغ');
  }, [currentUser]);

  /* ── unsubscribe — يلغي حتى طلبات pending ── */
  const unsubscribe = useCallback(async (mediator: MediatorRow): Promise<boolean> => {
    if (!currentUser) return false;
    const now = new Date().toISOString();

    try {
      markUnsubscribed(mediator.id);

      await Promise.all([
        // إلغاء في mediator_subscriptions (pending أو active)
        supabase.from('mediator_subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', currentUser.id)
          .eq('mediator_id', mediator.id)
          .in('status', ['pending', 'active']),

        // mediator_clients إن وُجد
        supabase.from('mediator_clients')
          .update({ status: 'cancelled' })
          .eq('user_id', currentUser.id)
          .eq('mediator_id', mediator.id)
          .eq('status', 'active'),

        // profiles.mediator_id
        supabase.from('profiles')
          .update({ mediator_id: null, updated_at: now })
          .eq('id', currentUser.id)
          .eq('mediator_id', mediator.id),
      ]);

      toast.success('تم إلغاء طلب الوساطة');
      await load();
      return true;

    } catch (e) {
      console.error('[unsubscribe]', e);
      markSubscribed(mediator.id);
      toast.error('حدث خطأ، حاول مرة أخرى');
      return false;
    }
  }, [currentUser, load, markSubscribed, markUnsubscribed]);

  return {
    mediators, loading, currentUser, subscribers, subLoading,
    load, openMediator, submitRating, reportMediator, unsubscribe,
    markSubscribed, markUnsubscribed,
  };
}