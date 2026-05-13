'use client';
/**
 * 📁 hooks/useAdMobReward.ts — ZAWAJ AI
 * ✅ يستخدم @capacitor-community/admob (الأكثر استقراراً)
 * ✅ يحمّل إعلانَين مسبقاً ويحافظ على وجود 2 جاهزَين دائماً
 * ✅ المكافأة تُمنح فور انتهاء الإعلان عبر rewardReceived
 * ✅ يعمل على Web بمحاكاة فورية
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { addBonusPoints } from '@/lib/services/EconomyService';
import { ECONOMY_RULES }  from '@/constants/ecomomy';
import { toast }          from 'sonner';

const IS_NATIVE = Capacitor.isNativePlatform();

// ── معرّف الوحدة الإعلانية ───────────────────────────────────
// استبدل بمعرّفك الحقيقي عند الرفع للإنتاج
const AD_UNIT_ID = IS_NATIVE
  ? (process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID ?? 'ca-app-pub-3940256099942544/5224354917')
  : 'ca-app-pub-3940256099942544/5224354917'; // test ID

// عدد الإعلانات الجاهزة المطلوب الحفاظ عليها
const POOL_SIZE = 2;

// ── نوع حالة الإعلان ─────────────────────────────────────────
type AdStatus = 'idle' | 'loading' | 'ready' | 'showing';

export function useSmartAdMobReward(userId: string | undefined, rewardAmount = 5) {
  const [pool,    setPool]    = useState<AdStatus[]>(['idle', 'idle']);
  const [showing, setShowing] = useState(false);
  const listenersRef = useRef<boolean>(false);

  // عدد الإعلانات الجاهزة فعلاً
  const readyCount = pool.filter(s => s === 'ready').length;
  const isAdReady  = readyCount > 0;
  const isLoadingAd = pool.some(s => s === 'loading');

  // ── منح المكافأة ──────────────────────────────────────────
  const grantReward = useCallback(async () => {
    if (!userId) return;
    try {
      await addBonusPoints(
        userId,
        rewardAmount,
        ECONOMY_RULES.TRANSACTION_SOURCES.ADMOB,
        `مكافأة مشاهدة إعلان — +${rewardAmount} نقطة`
      );
      toast.success(`🎁 تم إضافة ${rewardAmount} نقطة مكافأة!`);
    } catch {
      toast.error('فشل تسجيل المكافأة، حاول لاحقاً.');
    }
  }, [userId, rewardAmount]);

  // ── تهيئة AdMob وتسجيل المستمعات (مرة واحدة فقط) ──────────
  const initListeners = useCallback(async () => {
    if (!IS_NATIVE || listenersRef.current) return;
    listenersRef.current = true;

    try {
      const { AdMob } = await import('@capacitor-community/admob');

      // تهيئة SDK
      await AdMob.initialize({
        requestTrackingAuthorization: false,
        testingDevices: [], // أضف device ID جهازك هنا للاختبار
        initializeForTesting: !process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID,
      });

      // ✅ المكافأة — يُطلق قبل إغلاق الإعلان
      await AdMob.addListener('onRewardedVideoAdRewarded', () => {
        grantReward();
      });

      // إعادة تحميل بعد الإغلاق
      await AdMob.addListener('onRewardedVideoAdClosed', () => {
        setShowing(false);
        // أعد تحميل واحد لاستعادة الـ pool
        loadOne();
      });

    } catch (e) {
      console.error('[AdMob] init failed:', e);
    }
  }, [grantReward]); // eslint-disable-line

  // ── تحميل إعلان واحد ─────────────────────────────────────
  const loadOne = useCallback(async () => {
    if (!IS_NATIVE) return;

    // أضف slot loading في أول فراغ
    setPool(prev => {
      const idx = prev.findIndex(s => s === 'idle');
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = 'loading';
      return next;
    });

    try {
      const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');

      await AdMob.prepareRewardVideoAd({
        adId: AD_UNIT_ID,
        isTesting: !process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID,
      });

      // نجح التحميل
      setPool(prev => {
        const idx = prev.findIndex(s => s === 'loading');
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = 'ready';
        return next;
      });
    } catch (e) {
      console.error('[AdMob] load failed:', e);
      // إعادة الـ slot لـ idle
      setPool(prev => {
        const idx = prev.findIndex(s => s === 'loading');
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = 'idle';
        return next;
      });
    }
  }, []);

  // ── تحميل الـ pool الكامل ────────────────────────────────
  const fillPool = useCallback(async () => {
    if (!IS_NATIVE || !userId) return;
    await initListeners();

    // احسب كم إعلان ينقص
    setPool(prev => {
      const needed = POOL_SIZE - prev.filter(s => s === 'ready' || s === 'loading').length;
      if (needed <= 0) return prev;
      // ابدأ التحميل بعدد الناقص
      for (let i = 0; i < needed; i++) setTimeout(() => loadOne(), i * 300);
      return prev;
    });
  }, [userId, initListeners, loadOne]);

  // ── تحميل فور توفر userId ────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    if (!IS_NATIVE) {
      // وضع الويب — نعتبر الإعلانَين جاهزَين فوراً
      setPool(['ready', 'ready']);
      return;
    }

    fillPool();
  }, [userId]); // eslint-disable-line

  // ── عرض الإعلان ──────────────────────────────────────────
  const showAd = useCallback(async () => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول أولاً.');
      return;
    }

    // وضع الويب — محاكاة فورية
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

      // استهلك slot واحد من الـ pool
      setPool(prev => {
        const idx = prev.findIndex(s => s === 'ready');
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = 'idle';
        return next;
      });

      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.showRewardVideoAd();

      // ابدأ تحميل بديل فوراً لاستعادة الـ pool
      setTimeout(() => loadOne(), 500);

    } catch (e) {
      console.error('[AdMob] show failed:', e);
      setShowing(false);
      toast.error('حدث خطأ أثناء عرض الإعلان.');
      loadOne();
    }
  }, [userId, isAdReady, grantReward, fillPool, loadOne]);

  return {
    showAd,
    isAdReady,
    isLoadingAd,
    readyCount,
    showing,
  };
}