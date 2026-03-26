import { AdMobPlus } from "@admob-plus/capacitor";

// دالة التحميل المسبق (Preload)
export const preloadRewardedAd = async (): Promise<void> => {
  const adUnitId = "ca-app-pub-3940256099942544/5224354917"; // المعرف التجريبي
  try {
    await AdMobPlus.rewardVideoPrepare({ adUnitId });
    console.log("إعلان الفيديو جاهز في الخلفية");
  } catch (e) {
    console.error("فشل تجهيز الإعلان:", e);
  }
};

// دالة العرض عند الضغط على الزر
export const showRewardedAd = async (): Promise<void> => {
  try {
    await AdMobPlus.rewardVideoShow();
    // بعد العرض، نقوم بالتحميل مرة أخرى للمرة القادمة
    preloadRewardedAd();
  } catch {
    // إذا لم يكن جاهزاً، نحاول التحميل والعرض فوراً كحل أخير
    await preloadRewardedAd();
    try {
       await AdMobPlus.rewardVideoShow();
    } catch {
       throw new Error("No Ad Ready");
    }
  }
};