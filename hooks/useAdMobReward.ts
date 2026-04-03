'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { addBonusPoints } from '@/lib/services/EconomyService';
import { ECONOMY_RULES } from '@/constants/ecomomy';
import { toast } from 'sonner';

const IS_NATIVE = Capacitor.isNativePlatform();
// استخدام معرف حقيقي من ملف .env أو معرف الاختبار كاحتياطي
const AD_UNIT_ID = process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917';

export const useSmartAdMobReward = (userId: string | undefined, rewardAmount: number = 5) => {
  const [isAdReady, setIsAdReady] = useState<boolean>(false);
  const [isLoadingAd, setIsLoadingAd] = useState<boolean>(false);
  const adRef = useRef<any>(null);

  // 1. وظيفة منح المكافأة (مشتركة بين الويب والموبايل)
  const grantReward = useCallback(async () => {
    if (!userId) return;
    try {
      await addBonusPoints(
        userId,
        rewardAmount,
        ECONOMY_RULES.TRANSACTION_SOURCES.ADMOB,
        `مشاهدة إعلان — +${rewardAmount} نقطة`
      );
      toast.success(`🎁 تم إضافة ${rewardAmount} نقطة مكافأة بنجاح!`);
    } catch (error) {
      console.error('[AdMob reward error]', error);
      toast.error('فشل تسجيل المكافأة، يرجى المحاولة لاحقاً.');
    }
  }, [userId, rewardAmount]);

  // 2. وظيفة تحميل الإعلان المسبق (Preload)
  const loadAd = useCallback(async () => {
    if (!IS_NATIVE || !userId) {
      setIsAdReady(true); // في الويب، نعتبره جاهزاً دائماً للمحاكاة
      return;
    }

    setIsLoadingAd(true);
    try {
      // استيراد ديناميكي لتفادي انهيار SSR (Next.js Build)
      const { RewardedAd } = await import('@admob-plus/capacitor');
      
      if (!adRef.current) {
        adRef.current = new RewardedAd({ adUnitId: AD_UNIT_ID });
        
        // ربط حدث المكافأة
        adRef.current.on('reward', grantReward);
        
        // إعادة تحميل إعلان جديد فور إغلاق الإعلان الحالي
        adRef.current.on('dismiss', () => {
          setIsAdReady(false);
          loadAd(); // Preload next ad silently
        });
      }

      await adRef.current.load();
      setIsAdReady(true);
      console.log('[AdMob] ✅ الإعلان جاهز للعرض');
    } catch (error) {
      console.error('[AdMob load error]', error);
      setIsAdReady(false);
    } finally {
      setIsLoadingAd(false);
    }
  }, [userId, grantReward]);

  // 3. التحميل التلقائي بمجرد دخول المستخدم للواجهة
  useEffect(() => {
    loadAd();
    
    // تنظيف الموارد عند الخروج من الصفحة
    return () => {
      if (adRef.current) {
        // إذا كانت المكتبة تدعم إزالة المستمعات، يفضل إضافتها هنا
        adRef.current = null;
      }
    };
  }, [loadAd]);

  // 4. وظيفة عرض الإعلان عند ضغط المستخدم
  const showAd = async () => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول أولاً.');
      return;
    }

    if (!IS_NATIVE) {
      console.log('[AdMob] Web mode — محاكاة المكافأة');
      await grantReward();
      return;
    }

    if (!isAdReady || !adRef.current) {
      toast.info('الإعلان قيد التحميل، جرب مرة أخرى بعد ثوانٍ...');
      loadAd(); // محاولة التحميل مجدداً إذا فشل سابقاً
      return;
    }

    try {
      await adRef.current.show();
      // ملاحظة: حدث 'dismiss' سيقوم بتحميل الإعلان القادم تلقائياً
    } catch (error) {
      console.error('[AdMob show error]', error);
      toast.error('حدث خطأ أثناء عرض الإعلان.');
      setIsAdReady(false);
      loadAd();
    }
  };

  // إرجاع كائن لحل مشكلة Destructuring التي واجهتك
  return { showAd, isAdReady, isLoadingAd, loadAd };
};