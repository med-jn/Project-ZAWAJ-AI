'use client';
import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import { supabase }            from '@/lib/supabase/client';
import { Capacitor }           from '@capacitor/core';

export default function AuthCallbackPage() {
  const router  = useRouter();
  const [deepLink, setDeepLink] = useState<string | null>(null);

  useEffect(() => {
    const hash   = window.location.hash;
    const search = window.location.search;
    const params = hash || search;

    if (!Capacitor.isNativePlatform() && params) {
      setDeepLink(`com.zawaj.ai://auth/callback${params}`);
      return;
    }

    const handleNative = async () => {
      try {
        if (params) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }
      } catch {}
      await new Promise(r => setTimeout(r, 500));
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

    handleNative();
  }, [router]);

  if (deepLink) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080008',
        gap: '24px',
        fontFamily: 'Cairo, sans-serif',
      }}>
        <div style={{
          color: '#C084FC',
          fontSize: '28px',
          fontWeight: 900,
          letterSpacing: '0.15em',
        }}>
          {'ZAWAJ AI'}
        </div>

        <p style={{ color: '#fff', fontSize: '16px', margin: 0 }}>
          {'تم تسجيل الدخول بنجاح ✅'}
        </p>

        <a
          href={deepLink}
          style={{
            background: '#C084FC',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'block',
          }}
        >
          {'العودة للتطبيق'}
        </a>

        <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
          {'إذا لم يفتح التطبيق تلقائياً، اضغط الزر أعلاه'}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
    }}>
      <div style={{
        color: 'var(--color-primary)',
        fontSize: '28px',
        fontWeight: 900,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        {'ZAWAJ AI'}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}