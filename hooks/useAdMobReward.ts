'use client';
/**
 * 📁 hooks/useAdMobReward.ts — ZAWAJ AI
 * ✅ أسماء أحداث صحيحة لـ @capacitor-community/admob v8:
 *    onRewardedVideoAdReward     (وليس onRewardedVideoAdRewarded)
 *    onRewardedVideoAdDismissed  (وليس onRewardedVideoAdClosed)
 *    onRewardedVideoAdFailedToLoad ← نفسه
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { addBonusPoints } from '@/lib/services/EconomyService';
import { ECONOMY_RULES }  from '@/constants/ecomomy';
import { toast }          from 'sonner';

const IS_NATIVE = Capacitor.isNativePlatform();

const AD_UNIT_ID = process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID
  ?? 'ca-app-pub-3940256099942544/5224354917';

const POOL_SIZE = 2;
type AdStatus = 'idle' | 'loading' | 'ready' | 'showing';

export function useSmartAdMobReward(userId: string | undefined, rewardAmount = 5) {
  const [pool,    setPool]    = useState<AdStatus[]>(['idle', 'idle']);
  const [showing, setShowing] = useState(false);

  const listenersRef = useRef(false);
  const grantedRef   = useRef(false);
  const userIdRef    = useRef(userId);
  const rewardAmtRef = useRef(rewardAmount);

  useEffect(() => { userIdRef.current   = userId;       }, [userId]);
  useEffect(() => { rewardAmtRef.current = rewardAmount; }, [rewardAmount]);

  const readyCount  = pool.filter(s => s === 'ready').length;
  const isAdReady   = readyCount > 0;
  const isLoadingAd = pool.some(s => s === 'loading');

  // ── منح المكافأة ─────────────────────────────────────────
  const grantReward = useCallback(async () => {
    const uid = userIdRef.current;
    const amt = rewardAmtRef.current;
    if (!uid) return;
    try {
      await addBonusPoints(
        uid, amt,
        ECONOMY_RULES.TRANSACTION_SOURCES.ADMOB,
        `مكافأة مشاهدة إعلان — +${amt} نقطة`
      );
      toast.success(`تم إضافة ${amt} نقطة مكافأة!`);
    } catch (e) {
      console.error('[AdMob] grantReward error:', e);
      toast.error('فشل تسجيل المكافأة، حاول لاحقاً.');
    }
  }, []);

  // ── تحميل إعلان واحد ────────────────────────────────────
  const loadOne = useCallback(async () => {
    if (!IS_NATIVE) return;

    setPool(prev => {
      if (!prev.some(s => s === 'idle')) return prev;
      const next = [...prev];
      const idx  = next.findIndex(s => s === 'idle');
      next[idx]  = 'loading';
      return next;
    });

    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.prepareRewardVideoAd({
        adId:      AD_UNIT_ID,
        isTesting: !process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID,
      });
      setPool(prev => {
        const idx = prev.findIndex(s => s === 'loading');
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx]  = 'ready';
        return next;
      });
    } catch (e) {
      console.error('[AdMob] load failed:', e);
      setPool(prev => {
        const idx = prev.findIndex(s => s === 'loading');
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx]  = 'idle';
        return next;
      });
    }
  }, []);

  // ── تسجيل المستمعات مرة واحدة ───────────────────────────
  const initListeners = useCallback(async () => {
    if (!IS_NATIVE || listenersRef.current) return;
    listenersRef.current = true;

    try {
      const { AdMob } = await import('@capacitor-community/admob');

      await AdMob.initialize({
        requestTrackingAuthorization: false,
        initializeForTesting: !process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID,
      });

      // ✅ الاسم الصحيح في v8: onRewardedVideoAdReward (بدون 'ed')
      await AdMob.addListener('onRewardedVideoAdReward', () => {
        if (grantedRef.current) return;
        grantedRef.current = true;
        grantReward();
      });

      // ✅ الاسم الصحيح في v8: onRewardedVideoAdDismissed (بدون 'Closed')
      await AdMob.addListener('onRewardedVideoAdDismissed', () => {
        setShowing(false);
        grantedRef.current = false;
        setTimeout(() => loadOne(), 500);
      });

      await AdMob.addListener('onRewardedVideoAdFailedToLoad', (info: any) => {
        console.error('[AdMob] failed to load:', info);
        setPool(prev => {
          const idx = prev.findIndex(s => s === 'loading');
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx]  = 'idle';
          return next;
        });
      });

    } catch (e) {
      console.error('[AdMob] init failed:', e);
      listenersRef.current = false;
    }
  }, [grantReward, loadOne]);

  // ── ملء الـ pool ─────────────────────────────────────────
  const fillPool = useCallback(async () => {
    if (!IS_NATIVE || !userIdRef.current) return;
    await initListeners();
    const needed = POOL_SIZE - pool.filter(s => s === 'ready' || s === 'loading').length;
    for (let i = 0; i < needed; i++) {
      setTimeout(() => loadOne(), i * 400);
    }
  }, [pool, initListeners, loadOne]);

  // ── تهيئة عند توفر userId ───────────────────────────────
  useEffect(() => {
    if (!userId) return;
    if (!IS_NATIVE) {
      setPool(['ready', 'ready']);
      return;
    }
    fillPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── عرض الإعلان ─────────────────────────────────────────
  const showAd = useCallback(async () => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول أولاً.');
      return;
    }

    if (!IS_NATIVE) {
      await grantReward();
      return;
    }

    if (!isAdReady) {
      toast.info('الإعلان قيد التحميل، انتظر لحظة…');
      fillPool();
      return;
    }

    try {
      setShowing(true);
      grantedRef.current = false;

      setPool(prev => {
        const idx = prev.findIndex(s => s === 'ready');
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx]  = 'idle';
        return next;
      });

      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.showRewardVideoAd();

    } catch (e) {
      console.error('[AdMob] show failed:', e);
      setShowing(false);
      toast.error('حدث خطأ أثناء عرض الإعلان.');
      loadOne();
    }
  }, [userId, isAdReady, grantReward, fillPool, loadOne]);

  return { showAd, isAdReady, isLoadingAd, readyCount, showing };
}