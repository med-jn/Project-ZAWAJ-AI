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
        const params = hash || search;

        if (params) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }

        await new Promise(r => setTimeout(r, 500));

        // ── فحص نوع الرابط ──────────────────────────────────
        const searchParams = new URLSearchParams(search);
        const hashParams   = new URLSearchParams(hash.replace('#', '?'));
        const type = searchParams.get('type') || hashParams.get('type');

        // إذا كان رابط إعادة تعيين كلمة المرور
        if (type === 'recovery') {
          router.replace('/reset-password');
          return;
        }

        // ── باقي الحالات (تأكيد إيميل، تسجيل دخول، إلخ) ───
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