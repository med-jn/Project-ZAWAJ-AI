'use client';
/**
 * 📁 hooks/useNativeAndroid.ts — ZAWAJ AI
 * ✅ Back button فقط — لا imports ثقيلة
 * ✅ StatusBar يُضبط من capacitor.config.ts تلقائياً
 */
import { useEffect, useRef }          from 'react';
import { useRouter, usePathname }     from 'next/navigation';
import { Capacitor }                  from '@capacitor/core';
import { App }                        from '@capacitor/app';

const IS_NATIVE  = Capacitor.isNativePlatform();
const EXIT_PAGES = ['/', '/home', '/login', '/register'];

export function useNativeAndroid() {
  const router      = useRouter();
  const pathname    = usePathname();
  const pathRef     = useRef(pathname);

  // تحديث الـ ref عند كل تغيير — بدون إعادة إنشاء الـ listener
  useEffect(() => { pathRef.current = pathname; }, [pathname]);

  // Back button — مرة واحدة فقط طوال عمر التطبيق
  useEffect(() => {
    if (!IS_NATIVE) return;

    let handle: any = null;

    App.addListener('backButton', ({ canGoBack }) => {
      const p     = pathRef.current;
      const clean = p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p;

      if (EXIT_PAGES.includes(clean) || !canGoBack) {
        App.exitApp();
      } else {
        router.back();
      }
    }).then(h => { handle = h; });

    return () => { handle?.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}