'use client';
/**
 * hooks/useMediators.ts
 *
 * إصلاحات:
 * 1. isSubscribed من mediator_subscriptions (لا profiles.mediator_id)
 *    → يدعم اشتراك متعدد مع وسطاء مختلفين
 * 2. openMediator: المشتركون من mediator_subscriptions active (لا profiles.mediator_id)
 * 3. unsubscribe: حُذف insert point_transaction (كان يسبب معاملة وهمية -0)
 * 4. الزر يتغير فور الاشتراك (optimistic update على activeSubIds)
 */

import { useState, useCallback, useRef } from 'react';
import { toast }                          from 'sonner';
import { supabase }                       from '@/lib/supabase/client';
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
  // optimistic toggle بدون انتظار reload
  markSubscribed:   (mediatorId: string) => void;
  markUnsubscribed: (mediatorId: string) => void;
}

export function useMediators(): UseMediatorsReturn {
  const [mediators,   setMediators]   = useState<MediatorRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [balance,     setBalance]     = useState(0);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subLoading,  setSubLoading]  = useState(false);

  // مجموعة الوسطاء الذين المستخدم مشترك معهم حالياً
  const activeSubIds = useRef<Set<string>>(new Set());

  /* ── load ─────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let me: CurrentUser | null = null;

    if (user) {
      const [p, w, subs] = await Promise.all([
        supabase.from('profiles')
          .select('id,full_name,gender,mediator_id').eq('id', user.id).single(),
        supabase.from('wallets')
          .select('balance').eq('id', user.id).single(),
        // ← جلب كل اشتراكات المستخدم النشطة
        supabase.from('mediator_subscriptions')
          .select('mediator_id')
          .eq('id', user.id)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString()),
      ]);

      if (p.data) me = p.data as CurrentUser;
      setBalance(w.data?.balance ?? 0);

      // بناء Set للبحث السريع O(1)
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
      // ← الإصلاح الجوهري: من mediator_subscriptions لا profiles.mediator_id
      isSubscribed:      activeSubIds.current.has(m.id),
    }));

    rows.sort((a, b) => b.avg_rating - a.avg_rating);
    setMediators(rows);
    setLoading(false);
  }, []);

  /* ── optimistic toggles (الزر يتغير فوراً بدون انتظار reload) ── */
  const markSubscribed = useCallback((mediatorId: string) => {
    activeSubIds.current.add(mediatorId);
    setMediators(prev =>
      prev.map(m => m.id === mediatorId ? { ...m, isSubscribed: true } : m)
    );
  }, []);

  const markUnsubscribed = useCallback((mediatorId: string) => {
    activeSubIds.current.delete(mediatorId);
    setMediators(prev =>
      prev.map(m => m.id === mediatorId ? { ...m, isSubscribed: false } : m)
    );
  }, []);

  /* ── openMediator: المشتركون من mediator_subscriptions فقط ── */
  const openMediator = useCallback(async (m: MediatorRow) => {
    if (!currentUser) return;
    setSubLoading(true); setSubscribers([]);

    const oppGender = currentUser.gender === 'male' ? 'female' : 'male';

    // 1. جيب user_ids المشتركين النشطين مع هذا الوسيط
    const { data: activeSubs } = await supabase
      .from('mediator_subscriptions')
      .select('id')                    // id = user_id في هذا الجدول
      .eq('mediator_id', m.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    const subUserIds = (activeSubs ?? []).map((s: { id: string }) => s.id);

    if (subUserIds.length === 0) { setSubscribers([]); setSubLoading(false); return; }

    // 2. جيب الملفات الشخصية للجنس المقابل فقط
    const { data } = await supabase
      .from('profiles')
      .select('id,full_name,avatar_url,age,city,gender,profile_completion_percent')
      .in('id', subUserIds)
      .eq('gender', oppGender);

    setSubscribers(data ?? []);
    setSubLoading(false);
  }, [currentUser]);

  /* ── submitRating ─────────────────────────────────────── */
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

  /* ── reportMediator ───────────────────────────────────── */
  const reportMediator = useCallback(async (mediatorId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('reports')
      .insert({ reporter_id: currentUser.id, reported_id: mediatorId, reason: 'بلاغ عن وسيط' });
    if (error) { toast.error('فشل إرسال البلاغ'); return; }
    toast.success('تم إرسال البلاغ');
  }, [currentUser]);

  /* ── unsubscribe ──────────────────────────────────────── */
  const unsubscribe = useCallback(async (mediator: MediatorRow): Promise<boolean> => {
    if (!currentUser) return false;
    const now = new Date().toISOString();

    try {
      // Optimistic update — الزر يتغير فوراً
      markUnsubscribed(mediator.id);

      const [r1, r2, r3] = await Promise.all([
        // mediator_subscriptions ← مصدر الحقيقة للنشاط
        supabase.from('mediator_subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', currentUser.id)
          .eq('mediator_id', mediator.id)
          .eq('status', 'active'),

        // mediator_clients ← آخر سجل نشط
        supabase.from('mediator_clients')
          .update({ status: 'cancelled' })
          .eq('user_id', currentUser.id)
          .eq('mediator_id', mediator.id)
          .eq('status', 'active'),

        // profiles.mediator_id ← امسحه فقط لو كان نفس الوسيط
        supabase.from('profiles')
          .update({ mediator_id: null, updated_at: now })
          .eq('id', currentUser.id)
          .eq('mediator_id', mediator.id),  // لا يمسح لو كان وسيط آخر
      ]);

      const errs = [r1, r2, r3].map((r, i) => r.error ? `step${i+1}: ${r.error.message}` : null).filter(Boolean);
      if (errs.length) console.warn('[unsubscribe] partial:', errs);

      // لا نُسجّل point_transaction عند الإلغاء ← الإلغاء ليس معاملة مالية
      // السجل المالي محفوظ في mediator_clients (status cancelled)

      toast.success('تم إلغاء الاشتراك بنجاح');
      await load(); // reload لتحديث total_subscribers وغيرها
      return true;

    } catch (e) {
      console.error('[unsubscribe]', e);
      // rollback optimistic update
      markSubscribed(mediator.id);
      toast.error('حدث خطأ، حاول مرة أخرى');
      return false;
    }
  }, [currentUser, load, markSubscribed, markUnsubscribed]);

  return {
    mediators, loading, currentUser, balance, subscribers, subLoading,
    load, openMediator, submitRating, reportMediator, unsubscribe,
    markSubscribed, markUnsubscribed,
  };
}