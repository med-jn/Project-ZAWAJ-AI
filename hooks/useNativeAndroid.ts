'use client';
/**
 * 📁 hooks/useNativeAndroid.ts — ZAWAJ AI
 * ✅ Back button يُعدّ مرة واحدة فقط (لا تكرار)
 * ✅ StatusBar يُعدّ مرة واحدة فقط عند فتح التطبيق
 * ✅ لا dynamic imports في كل تنقل (كانت تسبب البطء)
 */
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

const IS_NATIVE = Capacitor.isNativePlatform();
const EXIT_PAGES = ['/', '/home', '/login', '/register'];

export function useNativeAndroid() {
  const router   = useRouter();
  const pathname = usePathname();

  // ref للمسار الحالي — يتجنب إعادة إنشاء الـ listener
  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  // ── Back Button: يُعدّ مرة واحدة فقط ──────────────────────
  useEffect(() => {
    if (!IS_NATIVE) return;

    let removeListener: (() => void) | null = null;

    const setup = async () => {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('backButton', ({ canGoBack }) => {
        const path = pathnameRef.current;
        const clean = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
        const isExit = EXIT_PAGES.includes(clean);

        if (isExit || !canGoBack) {
          App.exitApp();
        } else {
          router.back();
        }
      });
      removeListener = () => handle.remove();
    };

    setup();
    return () => { removeListener?.(); };
  }, []); // [] — مرة واحدة فقط

  // ── StatusBar: مرة واحدة عند فتح التطبيق ──────────────────
  useEffect(() => {
    if (!IS_NATIVE) return;

    const setup = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#080008' });
      } catch {}
    };

    setup();
  }, []); // [] — مرة واحدة فقط
}