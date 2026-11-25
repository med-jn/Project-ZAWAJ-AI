'use client';
/**
 * 📁 components/system/DeepLinkHandler.tsx — ZAWAJ AI
 * معالج عام للروابط العميقة (Warm Start) — يعمل في كل الصفحات.
 * السبب: كان المعالج القديم داخل الصفحة الرئيسية "/" فقط ويُلغى بمجرد مغادرتها،
 * فلا يفتح الإشعار أي صفحة بعد تسجيل الدخول.
 */
import { useEffect }   from 'react';
import { useRouter }   from 'next/navigation';
import { Capacitor }   from '@capacitor/core';
import { App }         from '@capacitor/app';
import { routeFromUrl, shouldNavigate } from '@/lib/notifications/deep-link';

export default function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as any;

    const go = (route: string) => {
      if (route && route.startsWith('/') && shouldNavigate(route)) router.push(route);
    };

    // يستدعيها MainActivity.java عند Warm Start
    w.__navigateTo = go;

    let removeListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', ({ url }) => {
        const route = routeFromUrl(url);
        if (route) go(route);
      }).then((l) => { removeListener = () => { l.remove(); }; });
    }

    return () => {
      w.__navigateTo = null;
      removeListener?.();
    };
  }, [router]);

  return null;
}
