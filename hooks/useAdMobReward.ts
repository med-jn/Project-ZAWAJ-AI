'use client';
/**
 * 📁 hooks/useAdMobReward.ts — ZAWAJ AI
 * ✅ Native: RewardedAd الحقيقي
 * ✅ Web/Dev: يستمع لـ CustomEvent من admob.ts (للاختبار على localhost)
 */
import { useEffect }      from 'react';
import { Capacitor }      from '@capacitor/core';
import { addBonusPoints } from '@/lib/services/EconomyService';
import { ECONOMY_RULES }  from '@/constants/ecomomy';
import { toast }          from 'sonner';

const IS_NATIVE  = Capacitor.isNativePlatform();
const AD_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917'; // ← استبدل

export const useAdMobReward = (userId: string, rewardAmount: number = 5) => {
  useEffect(() => {
    if (!userId) return;

    const grantReward = async () => {
      try {
        await addBonusPoints(
          userId,
          rewardAmount,
          ECONOMY_RULES.TRANSACTION_SOURCES.ADMOB,
          `مشاهدة إعلان — +${rewardAmount} نقطة`
        );
        toast.success(`🎁 تم إضافة ${rewardAmount} نقطة مكافأة!`);
      } catch (e) {
        console.error('[AdMob reward]', e);
        toast.error('فشل تسجيل المكافأة، تواصل مع الدعم.');
      }
    };

    if (IS_NATIVE) {
      let ad: any = null;
      const setup = async () => {
        try {
          const { RewardedAd } = await import('@admob-plus/capacitor');
          ad = new RewardedAd({ adUnitId: AD_UNIT_ID });
          ad.on('reward', grantReward);
          await ad.load();
        } catch (e) { console.error('[AdMob setup]', e); }
      };
      setup();
      return () => { ad = null; };
    } else {
      // محاكاة على Web — admob.ts يطلق هذا الحدث
      const handler = () => grantReward();
      window.addEventListener('admob-reward-simulated', handler);
      return () => window.removeEventListener('admob-reward-simulated', handler);
    }
  }, [userId, rewardAmount]);
};