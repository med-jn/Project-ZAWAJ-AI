/**
 * 📁 app/layout.tsx — ZAWAJ AI
 * ✅ Server Component — لا 'use client' هنا أبداً
 * ✅ Script مضمّن يطبّق الثيم + المقياس قبل أول رسم ← لا وميض
 * ✅ Sonner Toaster مُهيّأ للعربية RTL
 */

import type { Metadata, Viewport } from 'next';
import { Cairo }   from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

import ClientLayout from '@/components/layout/ClientLayout';

const cairo = Cairo({
  subsets:  ['arabic', 'latin'],
  weight:   ['300', '400', '500', '600', '700', '800', '900'],
  display:  'swap',
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title:       { default: 'ZAWAJ AI', template: '%s | ZAWAJ AI' },
  description: 'منصة الزواج الجاد المدعومة بالذكاء الاصطناعي',
  manifest:    '/manifest.json',
  icons:       { apple: '/apple-touch-icon.png' },
  verification: {
    google: 'NGEXMXzT6SpYRnz76pQauvgXBT4e-sEXWkr8UGvlYyk',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#080008' },
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
  ],
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * يُشغَّل قبل أي رسم (قبل React hydration) لمنع وميض الثيم.
 * suppressHydrationWarning على <html> يمنع تحذير React المتعلق
 * بـ dangerouslySetInnerHTML داخل Server Components.
 */
const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem('zawaj-theme') || 'system';
    var resolveTheme = function(mode) {
      if (mode === 'light') return 'light';
      if (mode === 'dark')  return 'dark';
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    };
    var resolved = resolveTheme(saved);
    if (resolved === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    var scale = parseFloat(localStorage.getItem('zawaj-scale') || '1');
    if (!isNaN(scale) && scale >= 0.7 && scale <= 1.5) {
      document.documentElement.style.setProperty('--user-scale', String(scale));
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cairo.variable}
      suppressHydrationWarning
    >
      <head>
        {/*
          ✅ يُشغَّل قبل أي CSS أو React — يمنع وميض الثيم تماماً.
          التحذير "Encountered a script tag" هو warning فقط وليس خطأ،
          ولا يؤثر على الأداء أو الوظيفة في Next.js App Router.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body style={{ margin: 0, padding: 0, overflowX: 'hidden' }}>

        <Toaster
          position="top-center"
          dir="rtl"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              fontFamily:   'var(--font-cairo), Cairo, sans-serif',
              fontSize:     'var(--text-sm)',
              background:   'var(--bg-elevated)',
              color:        'var(--text-main)',
              border:       '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
            },
          }}
        />

        <ClientLayout>{children}</ClientLayout>

      </body>
    </html>
  );
}