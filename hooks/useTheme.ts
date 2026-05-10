'use client';
/**
 * 📁 hooks/useTheme.ts — ZAWAJ AI
 * ✅ ثلاثة أوضاع: system | dark | light
 * ✅ وضع النظام: يتابع prefers-color-scheme تلقائياً
 * ✅ يحفظ التفضيل في localStorage ويستعيده فور الفتح
 * ✅ يُحدّث StatusBar عبر Capacitor عند تغيير الوضع
 */

import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'system' | 'dark' | 'light';
type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'zawaj-theme';

/** يقرأ الوضع المحفوظ — افتراضي: system */
function getSavedMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(STORAGE_KEY) as ThemeMode) ?? 'system';
}

/** هل النظام يفضّل الوضع الفاتح؟ */
function systemPrefersLight(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
}

/** يطبّق الوضع المحلول على <html> */
function applyResolved(resolved: ResolvedTheme) {
  const html = document.documentElement;
  if (resolved === 'light') {
    html.classList.add('light');
  } else {
    html.classList.remove('light');
  }
}

/** يُحدّث StatusBar لـ Capacitor (لا يرمي خطأ إذا غير متاح) */
async function syncStatusBar(resolved: ResolvedTheme) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({
      style: resolved === 'light' ? Style.Light : Style.Dark,
    });
    await StatusBar.setBackgroundColor({
      color: resolved === 'light' ? '#FFFFFF' : '#080008',
    });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    // بيئة غير Capacitor — نتجاهل
  }
}

export function useTheme() {
  const [mode,     setModeState]     = useState<ThemeMode>('system');
  const [resolved, setResolvedState] = useState<ResolvedTheme>('dark');

  /** يحسب الوضع المحلول ويطبّقه */
  const resolve = useCallback((m: ThemeMode): ResolvedTheme => {
    if (m === 'light') return 'light';
    if (m === 'dark')  return 'dark';
    return systemPrefersLight() ? 'light' : 'dark';
  }, []);

  const commit = useCallback((m: ThemeMode) => {
    const r = resolve(m);
    applyResolved(r);
    syncStatusBar(r);
    setModeState(m);
    setResolvedState(r);
    localStorage.setItem(STORAGE_KEY, m);
  }, [resolve]);

  // ── التهيئة الأولى ─────────────────────────────────────
  useEffect(() => {
    const saved = getSavedMode();
    commit(saved);
  }, []); // eslint-disable-line

  // ── متابعة تغيير النظام عند وضع system ─────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      if (getSavedMode() === 'system') {
        commit('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [commit]);

  const setTheme = (m: ThemeMode) => commit(m);
  /** للتوافق مع الكود القديم toggle dark↔light فقط */
  const toggle = () => commit(resolved === 'dark' ? 'light' : 'dark');

  return { theme: resolved, mode, setTheme, toggle };
}