'use client';
/**
 * 📁 hooks/useAdMobReward.ts — ZAWAJ AI
 * ✅ إصلاح BUG: AdMobPlus + RewardedAd (مطابق لـ lib/services/admob.ts)
 * ✅ يسجّل المعاملة في point_transactions عبر EconomyService
 */
import { useEffect }             from 'react';
import { AdMobPlus, RewardedAd } from '@admob-plus/capacitor';
import { addBonusPoints }        from '@/lib/services/EconomyService';
import { ECONOMY_RULES }         from '@/constants/ecomomy';
import { toast }                 from 'sonner';

// ⚠️ استبدل بمعرّف وحدتك الإعلانية الحقيقي في الإنتاج
const AD_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

export const useAdMobReward = (userId: string, rewardAmount: number = 5) => {
  useEffect(() => {
    if (!userId) return;

    let ad: InstanceType<typeof RewardedAd> | null = null;

    const setup = async () => {
      try {
        ad = new RewardedAd({ adUnitId: AD_UNIT_ID });

        // حدث المكافأة — يُطلق بعد إتمام المشاهدة
        ad.on('reward', async () => {
          try {
            await addBonusPoints(
              userId,
              rewardAmount,
              ECONOMY_RULES.TRANSACTION_SOURCES.ADMOB,
              `مشاهدة إعلان — +${rewardAmount} نقطة`
            );
            toast.success(`🎁 تم إضافة ${rewardAmount} نقطة مكافأة!`);
          } catch (e) {
            console.error('[AdMob reward] فشل تسجيل المكافأة:', e);
            toast.error('فشل تسجيل المكافأة، تواصل مع الدعم.');
          }
        });

        await ad.load(); // تحميل مسبق
      } catch (e) {
        console.error('[AdMob setup]', e);
      }
    };

    setup();
    return () => { ad = null; };
  }, [userId, rewardAmount]);
};