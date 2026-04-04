'use client';
/**
 * 📁 hooks/useNativeAndroid.ts — ZAWAJ AI
 * ✅ Back button — مرة واحدة طوال عمر التطبيق
 * ✅ StatusBar يتغير حسب المود (داكن/فاتح) تلقائياً
 */
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App }       from '@capacitor/app';

const IS_NATIVE  = Capacitor.isNativePlatform();
const EXIT_PAGES = ['/', '/home', '/login', '/register'];

// ألوان المودين — مطابقة لـ globals.css
const THEME_COLORS = {
  dark:  { bg: '#080008', style: 'DARK'  as const },
  light: { bg: '#FFFFFF', style: 'LIGHT' as const },
};

export function useNativeAndroid() {
  const router   = useRouter();
  const pathname = usePathname();
  const pathRef  = useRef(pathname);

  useEffect(() => { pathRef.current = pathname; }, [pathname]);

  // ── Back Button — مرة واحدة فقط ──────────────────────────
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

  // ── StatusBar — يتكيف مع المود ────────────────────────────
  useEffect(() => {
    if (!IS_NATIVE) return;

    const applyTheme = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        const isLight = document.documentElement.classList.contains('light');
        const theme   = isLight ? THEME_COLORS.light : THEME_COLORS.dark;

        await StatusBar.setStyle({
          style: isLight ? Style.Light : Style.Dark,
        });
        await StatusBar.setBackgroundColor({ color: theme.bg });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {}
    };

    // تطبيق فوري
    applyTheme();

    // مراقبة تغيير المود
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, {
      attributes: true, attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);
}