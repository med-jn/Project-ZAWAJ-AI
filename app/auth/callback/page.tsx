'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase }  from '@/lib/supabase/client';
import { Capacitor } from '@capacitor/core';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // استخرج الـ tokens من الـ URL مباشرة
      const hash   = window.location.hash;   // #access_token=...
      const search = window.location.search; // ?code=...

      // ── إذا على الجهاز وعندنا tokens في الـ URL ──
      // ابنِ Deep Link وأرسله للتطبيق
      if (!Capacitor.isNativePlatform() && (hash || search)) {
        const params = hash || search;
        // أعد فتح التطبيق مع الـ tokens
        window.location.replace(`com.zawaj.ai://auth/callback${params}`);
        return;
      }

      // ── معالجة الجلسة (Web أو Native) ──
      try {
        const url = window.location.href;
        if (hash?.includes('access_token') || search?.includes('code=')) {
          await supabase.auth.exchangeCodeForSession(url);
        }
      } catch {}

      await new Promise(r => setTimeout(r, 800));
      await redirect();
    };

    const redirect = async () => {
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
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}