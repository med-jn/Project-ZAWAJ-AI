'use client';
/**
 * 📁 hooks/useAdMobReward.ts — ZAWAJ AI
 * ✅ نقرة واحدة = جلب + عرض إجباري فوري (بدون pool، بدون فجوات)
 * ✅ كل إعلان يُجلب يُعرض، لا إعلانات ضائعة
 */
import { useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { addBonusPoints } from '@/lib/services/EconomyService';
import { ECONOMY_RULES }  from '@/constants/ecomomy';
import { toast }          from 'sonner';

const IS_NATIVE = Capacitor.isNativePlatform();

const AD_UNIT_ID = process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID
  ?? 'ca-app-pub-3940256099942544/5224354917';

type AdStatus = 'idle' | 'loading' | 'showing';

export function useSmartAdMobReward(userId: string | undefined, rewardAmount = 5) {
  const [status, setStatus] = useState<AdStatus>('idle');

  const listenersRef = useRef(false);
  const grantedRef   = useRef(false);
  const userIdRef    = useRef(userId);
  const rewardAmtRef = useRef(rewardAmount);

  userIdRef.current    = userId;
  rewardAmtRef.current = rewardAmount;

  const isLoadingAd = status === 'loading';
  const showing     = status === 'showing';
  const isAdReady   = false;
  const readyCount  = 0;

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

      await AdMob.addListener('onRewardedVideoAdReward', () => {
        if (grantedRef.current) return;
        grantedRef.current = true;
        grantReward();
      });

      await AdMob.addListener('onRewardedVideoAdDismissed', () => {
        setStatus('idle');
        grantedRef.current = false;
      });

      await AdMob.addListener('onRewardedVideoAdFailedToShow', (info: any) => {
        console.error('[AdMob] failed to show:', info);
        setStatus('idle');
        grantedRef.current = false;
      });

    } catch (e) {
      console.error('[AdMob] init failed:', e);
      listenersRef.current = false;
    }
  }, [grantReward]);

  // ── الزر: جلب ثم عرض فوري وإجباري ────────────────────────
  const showAd = useCallback(async () => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول أولاً.');
      return;
    }

    if (!IS_NATIVE) {
      // في المتصفح/التطوير: منح مباشر بدون إعلان
      await grantReward();
      return;
    }

    if (status !== 'idle') return; // منع الضغط المزدوج

    setStatus('loading');
    grantedRef.current = false;

    try {
      await initListeners();

      const { AdMob } = await import('@capacitor-community/admob');

      await AdMob.prepareRewardVideoAd({
        adId:      AD_UNIT_ID,
        isTesting: !process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID,
      });

      // فور الجلب → عرض إجباري فوري، بغض النظر عن مكان المستخدم في التطبيق
      setStatus('showing');
      await AdMob.showRewardVideoAd();

    } catch (e) {
      console.error('[AdMob] ad flow failed:', e);
      setStatus('idle');
      toast.error('تعذر تحميل الإعلان حالياً، حاول مجدداً بعد قليل.');
    }
  }, [userId, status, grantReward, initListeners]);

  return { showAd, isAdReady, isLoadingAd, readyCount, showing };
}