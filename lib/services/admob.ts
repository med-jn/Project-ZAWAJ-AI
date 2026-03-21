/**
 * 📁 lib/admob.ts — ZAWAJ AI
 * AdMob Core Service — Capacitor
 */
import { AdMob } from "@admob-plus/capacitor";
import { toast } from "sonner";

export const initializeAdMob = async (): Promise<void> => {
  try {
    await AdMob.start();
  } catch {
    toast.error("فشل تهيئة نظام الإعلانات");
  }
};

export const showRewardedAd = async (): Promise<void> => {
  const adUnitId = process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID;
  if (!adUnitId) {
    toast.error("خطأ في الإعداد: معرّف الإعلان مفقود");
    return;
  }
  try {
    await AdMob.rewardVideoPrepare({ adUnitId });
    await AdMob.rewardVideoShow();
  } catch {
    toast.error("تعذّر تحميل الفيديو، حاول مجدداً");
  }
};