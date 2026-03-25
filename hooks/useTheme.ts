'use client';
/**
 * 📁 hooks/useTheme.ts — ZAWAJ AI
 * ✅ الثيم الداكن افتراضي دائماً
 * ✅ يحفظ تفضيل المستخدم في localStorage
 * ✅ يطبّق الثيم المحفوظ عند أول تحميل
 *
 * الاستخدام:
 *   const { theme, toggle } = useTheme();
 */

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  // الافتراضي دائماً dark
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // قراءة التفضيل المحفوظ فقط — لا نعتمد على prefers-color-scheme
    const saved = localStorage.getItem('zawaj-theme') as Theme | null;
    if (saved === 'light') {
      document.documentElement.classList.add('light');
      setThemeState('light');
    } else {
      // dark هو الافتراضي — CSS يطبّقه تلقائياً
      document.documentElement.classList.remove('light');
      setThemeState('dark');
    }
  }, []);

  const applyTheme = (next: Theme) => {
    const html = document.documentElement;
    if (next === 'light') {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }
    localStorage.setItem('zawaj-theme', next);
    setThemeState(next);
  };

  const toggle = () => applyTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, toggle, setTheme: applyTheme };
}