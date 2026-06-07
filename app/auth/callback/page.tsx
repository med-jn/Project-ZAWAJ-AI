'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase }  from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash   = window.location.hash;
        const search = window.location.search;

        const searchParams = new URLSearchParams(search);
        const hashParams   = new URLSearchParams(hash.replace('#', '?'));

        const type      = searchParams.get('type')       || hashParams.get('type');
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
        const next      = searchParams.get('next')       || null;

        // ── حالة Recovery عبر token_hash ────────────────────────
        if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (!error) { router.replace('/reset-password'); return; }
        }

        // ── حالة hash قديمة (#access_token) ─────────────────────
        if (hash.includes('access_token')) {
          const hp           = new URLSearchParams(hash.replace('#', '?'));
          const accessToken  = hp.get('access_token')  ?? '';
          const refreshToken = hp.get('refresh_token') ?? '';
          const hashType     = hp.get('type');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (hashType === 'recovery') { router.replace('/reset-password'); return; }
            if (next)                   { router.replace(next);              return; }
          }
        }

        // ── حالة code ────────────────────────────────────────────
        const code = searchParams.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        await new Promise(r => setTimeout(r, 300));

        // ── next له الأولوية المطلقة بعد تبادل الجلسة ───────────
        if (next) { router.replace(next); return; }

        // ── type=recovery بدون token_hash (fallback) ─────────────
        if (type === 'recovery') { router.replace('/reset-password'); return; }

        // ── باقي الحالات ─────────────────────────────────────────
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const { data: profile } = await supabase
            .from('profiles').select('is_completed')
            .eq('id', session.user.id).maybeSingle();

          router.replace(profile?.is_completed ? '/home' : '/onboarding');
        } else {
          router.replace('/');
        }
      } catch {
        router.replace('/');
      }
    };

    handleCallback();
  }, [router]);

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
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        ZAWAJ AI
      </div>
      <p style={{ color: '#fff', fontSize: '16px', margin: 0 }}>
        جاري تسجيل الدخول...
      </p>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}