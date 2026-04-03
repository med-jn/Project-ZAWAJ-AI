'use client';
/**
 * 📁 hooks/useNativeAndroid.ts — ZAWAJ AI
 * ✅ زر الرجوع الفيزيائي (يتكامل مع PageHeader الموجود)
 * ✅ شريط الحالة بلون التطبيق
 * ✅ إخفاء شريط التنقل السفلي للأندرويد (edge-to-edge)
 */
import { useEffect }               from 'react';
import { useRouter, usePathname }  from 'next/navigation';
import { Capacitor }               from '@capacitor/core';
import { App }                     from '@capacitor/app';

const IS_NATIVE = Capacitor.isNativePlatform();

// صفحات الخروج — الضغط على Back فيها يخرج من التطبيق
const EXIT_PAGES = ['/', '/home', '/login', '/register'];

export function useNativeAndroid() {
  const router   = useRouter();
  const pathname = usePathname();

  // ── زر الرجوع الفيزيائي ───────────────────────────────────
  useEffect(() => {
    if (!IS_NATIVE) return;

    const path = pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname;

    const isExitPage = EXIT_PAGES.includes(path);

    const listener = App.addListener('backButton', ({ canGoBack }) => {
      if (isExitPage || !canGoBack) {
        App.exitApp();
      } else {
        router.back();
      }
    });

    return () => { listener.then(h => h.remove()); };
  }, [pathname, router]);

  // ── شريط الحالة ────────────────────────────────────────────
  useEffect(() => {
    if (!IS_NATIVE) return;

    const setup = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#080008' }); // --bg-main
        await StatusBar.show();
      } catch (e) {
        // المكتبة غير مثبتة أو خطأ — نتجاهل
        console.warn('[StatusBar]', e);
      }
    };

    setup();
  }, [pathname]); // يُعاد ضبطه عند كل تغيير صفحة
}