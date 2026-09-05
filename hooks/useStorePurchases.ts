'use client';
/**
 * 📁 hooks/useStorePurchases.ts — ZAWAJ AI
 * شراء العملات عبر Google Play (RevenueCat)
 *
 * ⚠️ أمان: هذا الهوك لا يحدّث wallets.balance مباشرة أبداً.
 * التحديث الفعلي يصير server-side فقط عبر googleplay-webhook
 * بعد تحقق RevenueCat من الشراء مع جوجل — لمنع أي تلاعب من الكلاينت.
 */
import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase }  from '@/lib/supabase/client';

const IS_NATIVE = Capacitor.isNativePlatform();
const RC_KEY    = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY!;

export interface StorePackage {
  identifier:  string; // 'pkg_s' | 'pkg_m' | 'pkg_l' — لازم تطابق economy_config.packages[].id
  priceString: string; // السعر المحلي جاهز من جوجل حسب دولة المستخدم
  title:       string;
}

export function useStorePurchases() {
  const [ready,    setReady]    = useState(false);
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [loading,  setLoading]  = useState(false);

  // ── تهيئة RevenueCat + ربط المستخدم (App User ID = supabase user.id) ──
  useEffect(() => {
    if (!IS_NATIVE) { setReady(true); return; }
    let cancelled = false;

    (async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor');
        await Purchases.configure({ apiKey: RC_KEY });

        const { data: { user } } = await supabase.auth.getUser();
        if (user) await Purchases.logIn({ appUserID: user.id });

        const offerings = await Purchases.getOfferings();
        if (!cancelled && offerings.current) {
          setPackages(offerings.current.availablePackages.map(p => ({
            identifier:  p.identifier,
            priceString: p.product.priceString,
            title:       p.product.title,
          })));
        }
      } catch (err) {
        console.error('[useStorePurchases] init error:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const buyCoinPackage = useCallback(async (identifier: string) => {
    if (!IS_NATIVE) throw new Error('الشراء متاح فقط داخل تطبيق أندرويد');
    setLoading(true);
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(p => p.identifier === identifier);
      if (!pkg) throw new Error('الباقة غير متوفرة حالياً');

      // ✅ الشراء فقط — الرصيد يتحدّث عبر webhook بعد تحقق جوجل من الدفع
      await Purchases.purchasePackage({ aPackage: pkg });
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, []);

  return { ready, packages, loading, buyCoinPackage, isNative: IS_NATIVE };
}