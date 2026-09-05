'use client';
/**
 * 📁 lib/services/AdManager.ts — ZAWAJ AI
 * ✅ مدير موحّد لإعلانات Interstitial
 * ✅ Preload دائم — الإعلان جاهز قبل الحاجة إليه (لا فجوة انتظار)
 * ✅ Cooldown مشترك بين كل نقاط التفعيل (سحب البطاقات + فتح الملف الكامل)
 * ✅ سقف يومي/جلسة يحمي من الإفراط
 */
import { Capacitor } from '@capacitor/core';

const IS_NATIVE = Capacitor.isNativePlatform();

const INTERSTITIAL_AD_UNIT_ID =
  process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID
  ?? 'ca-app-pub-3940256099942544/1033173712'; // ← Google test ID الرسمي

// ── إعدادات التردد (عدّلها بحرية) ──────────────────────────
const MIN_INTERVAL_MS   = 45_000; // أقل فاصل زمني بين إعلانين تلقائيين (45 ثانية)
const MAX_PER_SESSION   = 20;     // سقف أقصى لكل جلسة استخدام (حماية من الإفراط)

type AdMobType = typeof import('@capacitor-community/admob').AdMob;

let admob: AdMobType | null = null;
let listenersReady = false;
let isPreparing     = false;
let isReady         = false;
let isShowing        = false;
let lastShownAt      = 0;
let sessionCount     = 0;
let pendingCallback: (() => void) | null = null;

async function getAdMob(): Promise<AdMobType> {
  if (!admob) {
    const { AdMob } = await import('@capacitor-community/admob');
    admob = AdMob;
  }
  return admob;
}

async function ensureInit() {
  if (!IS_NATIVE || listenersReady) return;
  listenersReady = true;

  const AdMob = await getAdMob();
  await AdMob.initialize({
    requestTrackingAuthorization: false,
    initializeForTesting: !process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID,
  });

  AdMob.addListener('onInterstitialAdLoaded', () => {
    isReady = true;
    isPreparing = false;
  });

  AdMob.addListener('onInterstitialAdFailedToLoad', (e: any) => {
    console.error('[AdManager] load failed:', e);
    isReady = false;
    isPreparing = false;
  });

  const finishAndResume = () => {
    isShowing = false;
    isReady = false;
    // إعادة التحميل فوراً في الخلفية — دائماً إعلان جاهز للمرة القادمة
    preloadInterstitial();
    if (pendingCallback) {
      const cb = pendingCallback;
      pendingCallback = null;
      cb();
    }
  };

  AdMob.addListener('onInterstitialAdDismissed', finishAndResume);
  AdMob.addListener('onInterstitialAdFailedToShow', (e: any) => {
    console.error('[AdManager] show failed:', e);
    finishAndResume();
  });
}

/** حمّل إعلاناً مسبقاً (استدعِها عند بدء الجلسة، وتُستدعى تلقائياً بعد كل عرض) */
export async function preloadInterstitial() {
  if (!IS_NATIVE || isPreparing || isReady) return;
  isPreparing = true;
  try {
    await ensureInit();
    const AdMob = await getAdMob();
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_UNIT_ID,
      isTesting: !process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID,
    });
  } catch (e) {
    isPreparing = false;
    console.error('[AdManager] preload error:', e);
  }
}

function canShow(): boolean {
  if (!IS_NATIVE) return false;
  if (isShowing || !isReady) return false;
  if (sessionCount >= MAX_PER_SESSION) return false;
  if (Date.now() - lastShownAt < MIN_INTERVAL_MS) return false;
  return true;
}

/** يعرض الإعلان إن كان جاهزاً ومسموحاً بالتردد، بدون أي التزام بمتابعة */
export async function showInterstitialIfReady(): Promise<boolean> {
  if (!canShow()) return false;
  const AdMob = await getAdMob();
  try {
    isShowing = true;
    lastShownAt = Date.now();
    sessionCount++;
    await AdMob.showInterstitial();
    return true;
  } catch (e) {
    isShowing = false;
    console.error('[AdManager] show error:', e);
    return false;
  }
}

/**
 * يعرض الإعلان (إن كان مؤهلاً) ثم ينفّذ onComplete بعد إغلاقه.
 * إن لم يكن الإعلان جاهزاً/مؤهلاً، ينفّذ onComplete فوراً بدون تأخير المستخدم.
 * ✅ مثالي لنقاط مثل "فتح الملف الكامل" حيث الانتقال يجب أن يحصل دائماً.
 */
export function showInterstitialThenRun(onComplete: () => void) {
  if (!canShow()) { onComplete(); return; }

  pendingCallback = onComplete;
  (async () => {
    const AdMob = await getAdMob();
    try {
      isShowing = true;
      lastShownAt = Date.now();
      sessionCount++;
      await AdMob.showInterstitial();
    } catch (e) {
      console.error('[AdManager] showThenRun error:', e);
      isShowing = false;
      pendingCallback = null;
      onComplete();
    }
  })();
}