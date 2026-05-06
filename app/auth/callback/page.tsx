'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase }  from '@/lib/supabase/client';
import { Browser }   from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { App }       from '@capacitor/app';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {

      // ── استخرج tokens من الـ URL ──
      const hash = window.location.hash;

      // ── إذا على Vercel (Web) وجاء من Native ──
      // نعيد توجيه للتطبيق مباشرة بالـ tokens
      if (!Capacitor.isNativePlatform() && hash) {
        const isFromApp = document.referrer.includes('accounts.google.com')
          || hash.includes('access_token')
          || hash.includes('code=');

        if (isFromApp) {
          // أرسل الـ tokens للتطبيق عبر Deep Link
          window.location.href = `com.zawaj.ai://auth/callback${hash}`;
          return;
        }
      }

      // ── إغلاق المتصفح الداخلي ──
      if (Capacitor.isNativePlatform()) {
        try { await Browser.close(); } catch {}
      }

      // ── معالجة الجلسة ──
      if (hash) {
        await supabase.auth.exchangeCodeForSession(
          window.location.href
        ).catch(() => {});
      }

      await new Promise(r => setTimeout(r, 800));

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from('profiles').select('is_completed')
          .eq('id', session.user.id).maybeSingle();
        router.replace(profile?.is_completed ? '/home' : '/onboarding');
      } else {
        router.replace('/');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)',
    }}>
      <div style={{
        color: 'var(--color-primary)',
        fontSize: 'var(--text-2xl)',
        fontWeight: 900,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        ZAWAJ AI
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}