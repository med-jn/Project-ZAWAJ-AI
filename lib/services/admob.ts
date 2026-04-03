/**
 * 📁 lib/services/admob.ts — ZAWAJ AI
 * ✅ guard: لا يعمل على Web/localhost — Capacitor native فقط
 */
import { Capacitor }  from '@capacitor/core';
import { AdMobPlus }  from '@admob-plus/capacitor';

const IS_NATIVE = Capacitor.isNativePlatform();

const AD_UNIT_REWARDED = 'ca-app-pub-3940256099942544/5224354917'; // ← استبدل بمعرّفك

// ── التحميل المسبق ────────────────────────────────────────────
export const preloadRewardedAd = async (): Promise<void> => {
  if (!IS_NATIVE) {
    console.log('[AdMob] Web mode — skipping preload');
    return;
  }
  try {
    await AdMobPlus.rewardVideoPrepare({ adUnitId: AD_UNIT_REWARDED });
    console.log('[AdMob] إعلان جاهز في الخلفية');
  } catch (e) {
    console.error('[AdMob] فشل تجهيز الإعلان:', e);
  }
};

// ── العرض عند الضغط ──────────────────────────────────────────
export const showRewardedAd = async (): Promise<void> => {
  if (!IS_NATIVE) {
    // في وضع التطوير — محاكاة المكافأة مباشرة بدون إعلان
    console.log('[AdMob] Web mode — reward simulated');
    // اطرد حدثاً مخصصاً لـ useAdMobReward يستقبله
    window.dispatchEvent(new CustomEvent('admob-reward-simulated'));
    return;
  }
  try {
    await AdMobPlus.rewardVideoShow();
    preloadRewardedAd(); // إعادة تحميل للمرة القادمة
  } catch {
    await preloadRewardedAd();
    try {
      await AdMobPlus.rewardVideoShow();
    } catch {
      throw new Error('No Ad Ready');
    }
  }
};