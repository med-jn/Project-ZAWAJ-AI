/**
 * 📁 app/layout.tsx — ZAWAJ AI
 * ✅ Server Component — لا 'use client' هنا أبداً
 * ✅ الثيم الداكن افتراضي من CSS مباشرة — لا حاجة لـ script
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
  title:       { default: 'زواج AI', template: '%s | زواج AI' },
  description: 'منصة الزواج الجاد المدعومة بالذكاء الاصطناعي',
  manifest:    '/manifest.json',
  icons:       { apple: '/apple-touch-icon.png' },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cairo.variable}
      suppressHydrationWarning
    >
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