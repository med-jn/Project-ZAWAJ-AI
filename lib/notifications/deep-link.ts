/**
 * 📁 lib/notifications/deep-link.ts — ZAWAJ AI
 * أدوات الروابط العميقة القادمة من الإشعارات: zawaj://app/<route>
 */
import { Capacitor } from '@capacitor/core';
import { App }       from '@capacitor/app';

/** zawaj://app/view/?id=X  →  /view/?id=X  (وإلا null) */
export function routeFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'zawaj:' || u.hostname !== 'app') return null;
    const route = u.pathname + u.search;
    return route && route !== '/' ? route : null;
  } catch {
    return null;
  }
}

/** يمنع التنقل المزدوج (Java + Capacitor يُطلقان الحدث نفسه) */
let lastRoute = '';
let lastAt    = 0;
export function shouldNavigate(route: string): boolean {
  const now = Date.now();
  if (route === lastRoute && now - lastAt < 2000) return false;
  lastRoute = route;
  lastAt    = now;
  return true;
}

/**
 * Cold Start: المسار الذي فُتح به التطبيق من الإشعار (مرة واحدة فقط).
 * يعتمد على App.getLaunchUrl() (موثوق) مع __pendingRoute كاحتياط.
 */
let launchChecked = false;
export async function consumeLaunchRoute(): Promise<string | null> {
  if (launchChecked || typeof window === 'undefined') return null;
  launchChecked = true;

  const w = window as any;
  if (w.__pendingRoute && String(w.__pendingRoute).startsWith('/')) {
    const r = String(w.__pendingRoute);
    w.__pendingRoute = null;
    return r;
  }
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const res = await App.getLaunchUrl();
    return res?.url ? routeFromUrl(res.url) : null;
  } catch {
    return null;
  }
}
