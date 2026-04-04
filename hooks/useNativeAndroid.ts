'use client';
/**
 * 📁 hooks/useNativeAndroid.ts — ZAWAJ AI
 * ✅ Back button — مرة واحدة طوال عمر التطبيق
 * ✅ StatusBar يتكيف مع المود (داكن/فاتح) تلقائياً
 */
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App }       from '@capacitor/app';

const IS_NATIVE  = Capacitor.isNativePlatform();
const EXIT_PAGES = ['/', '/home', '/login', '/register'];

export function useNativeAndroid() {
  const router  = useRouter();
  const pathname = usePathname();
  const pathRef  = useRef(pathname);

  useEffect(() => { pathRef.current = pathname; }, [pathname]);

  // ── Back Button ───────────────────────────────────────────
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
  }, []); // eslint-disable-line

  // ── StatusBar يتكيف مع المود تلقائياً ────────────────────
  useEffect(() => {
    if (!IS_NATIVE) return;

    const apply = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        const isLight = document.documentElement.classList.contains('light');
        await StatusBar.setStyle({ style: isLight ? Style.Light : Style.Dark });
        await StatusBar.setBackgroundColor({ color: isLight ? '#FFFFFF' : '#080008' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {}
    };

    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true, attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);
}