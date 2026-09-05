'use client';
/**
 * 📁 hooks/useAdMobReward.ts — ZAWAJ AI
 * ✅ نقرة واحدة = جلب + عرض إجباري فوري (بدون pool، بدون فجوات)
 * ✅ بعد كل مشاهدة ناجحة: عرض اختياري لمشاهدة إعلان إضافي مقابل مكافأة مضاعفة
 *    (اختياري تماماً — لا يُفرض على المستخدم، ويُعرض مرة واحدة فقط لكل دورة)
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
  const [status, setStatusState] = useState<AdStatus>('idle');
  const statusRef = useRef<AdStatus>('idle');
  const setStatus = (s: AdStatus) => { statusRef.current = s; setStatusState(s); };

  const listenersRef    = useRef(false);
  const grantedRef      = useRef(false);
  const userIdRef       = useRef(userId);
  const rewardAmtRef    = useRef(rewardAmount);
  const bonusOfferedRef = useRef(false); // منع تكرار العرض أكثر من مرة لكل دورة مشاهدة
  const pendingAmtRef   = useRef(rewardAmount);
  const pendingNoteRef  = useRef('');

  userIdRef.current    = userId;
  rewardAmtRef.current = rewardAmount;

  // ── منح المكافأة ─────────────────────────────────────────
  const grantReward = useCallback(async (amt: number, note: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      await addBonusPoints(uid, amt, ECONOMY_RULES.TRANSACTION_SOURCES.ADMOB, note);
      toast.success(`تم إضافة ${amt} نقطة مكافأة!`);
    } catch (e) {
      console.error('[AdMob] grantReward error:', e);
      toast.error('فشل تسجيل المكافأة، حاول لاحقاً.');
    }
  }, []);

  // ── التدفق الأساسي: جلب ثم عرض فوري وإجباري ──────────────
  const showAdInternal = useCallback(async (isBonusRound: boolean) => {
    if (!userIdRef.current) {
      toast.error('يجب تسجيل الدخول أولاً.');
      return;
    }

    const amt  = rewardAmtRef.current;
    const note = isBonusRound
      ? `مكافأة إضافية مضاعفة — +${amt} نقطة`
      : `مكافأة مشاهدة إعلان — +${amt} نقطة`;

    if (!IS_NATIVE) {
      // في المتصفح/التطوير: منح مباشر بدون إعلان
      await grantReward(amt, note);
      return;
    }

    if (statusRef.current !== 'idle') return; // منع الضغط المزدوج

    pendingAmtRef.current  = amt;
    pendingNoteRef.current = note;
    if (!isBonusRound) bonusOfferedRef.current = false; // دورة جديدة → مؤهلة لعرض المكافأة الإضافية

    setStatus('loading');
    grantedRef.current = false;

    try {
      await initListeners();

      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.prepareRewardVideoAd({
        adId:      AD_UNIT_ID,
        isTesting: !process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID,
      });

      setStatus('showing');
      await AdMob.showRewardVideoAd();

    } catch (e) {
      console.error('[AdMob] ad flow failed:', e);
      setStatus('idle');
      toast.error('تعذر تحميل الإعلان حالياً، حاول مجدداً بعد قليل.');
    }
  }, [grantReward]);

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
        grantedRef.current = true;
      });

      await AdMob.addListener('onRewardedVideoAdDismissed', () => {
        setStatus('idle');
        const wasGranted = grantedRef.current;
        grantedRef.current = false;
        if (!wasGranted) return;

        grantReward(pendingAmtRef.current, pendingNoteRef.current);

        // ── عرض فرصة إعلان إضافي اختياري (مرة واحدة فقط لكل دورة) ──
        if (!bonusOfferedRef.current) {
          bonusOfferedRef.current = true;
          setTimeout(() => {
            toast('شاهد إعلاناً إضافياً واكسب الضعف؟', {
              description: `+${rewardAmtRef.current} نقطة إضافية`,
              action: {
                label:   'مشاهدة',
                onClick: () => showAdInternal(true),
              },
              duration: 6000,
            });
          }, 400);
        }
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
  }, [grantReward, showAdInternal]);

  const showAd = useCallback(() => showAdInternal(false), [showAdInternal]);

  return {
    showAd,
    isLoadingAd: status === 'loading',
    showing:     status === 'showing',
    isAdReady:   false, // ← للتوافق مع أي كود قديم يعتمد عليها
    readyCount:  0,
  };
}