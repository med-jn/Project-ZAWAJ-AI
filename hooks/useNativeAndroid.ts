'use client';
/**
 * 📁 hooks/useNativeAndroid.ts — ZAWAJ AI
 * ✅ Back button — مرة واحدة طوال عمر التطبيق
 * ✅ StatusBar يتكيف مع الثيم (داكن/فاتح) تلقائياً عبر MutationObserver
 * ✅ NavigationBar (شريط الأزرار السفلي) يطابق خلفية التطبيق
 * ✅ EdgeToEdge مفعّل لتغطية كامل الشاشة بمحتوى التطبيق
 * ✅ StatusBar يُحدَّث فور تغيير وضع الثيم دون إعادة تحميل
 */
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App }       from '@capacitor/app';

const IS_NATIVE  = Capacitor.isNativePlatform();
const EXIT_PAGES = ['/', '/home', '/login', '/register'];

/** يقرأ لون الخلفية الحالي بناءً على وجود كلاس light */
function getBgColor(): string {
  return document.documentElement.classList.contains('light') ? '#FFFFFF' : '#080008';
}

/** يطبّق إعدادات الشريط الكاملة */
async function applyBars() {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const isLight = document.documentElement.classList.contains('light');
    const bgColor = getBgColor();
  

    // شريط الحالة العلوي
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: isLight ? Style.Light : Style.Dark });
    await StatusBar.setBackgroundColor({ color: getBgColor() });

    // NavigationBar — يُتحكم به من styles.xml مباشرة
  } catch {
    // بيئة غير Capacitor — نتجاهل
  }
}

export function useNativeAndroid() {
  const router   = useRouter();
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

  // ── StatusBar + NavigationBar يتكيفان مع الثيم تلقائياً ─
  useEffect(() => {
    if (!IS_NATIVE) return;

    // تطبيق فوري عند التحميل
    applyBars();

    // متابعة تغيير كلاس light على <html>
    const observer = new MutationObserver(applyBars);
    observer.observe(document.documentElement, {
      attributes: true, attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);
}