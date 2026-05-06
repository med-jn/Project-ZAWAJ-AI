'use client';
import { useEffect }    from 'react';
import { useRouter }    from 'next/navigation';
import { supabase }     from '@/lib/supabase/client';
import { Browser }      from '@capacitor/browser';
import { Capacitor }    from '@capacitor/core';
import { App }          from '@capacitor/app';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {

      // ── على Vercel (Web) وعندنا tokens في الـ URL ──
      // نعيد للتطبيق مباشرة عبر Deep Link
      if (!Capacitor.isNativePlatform()) {
        const hash   = window.location.hash;
        const search = window.location.search;

        if (hash || search) {
          // حاول تبادل الكود أولاً
          try {
            await supabase.auth.exchangeCodeForSession(window.location.href);
          } catch {}

          // أعد التوجيه للتطبيق
          const params = hash || search;
          window.location.href = `com.zawaj.ai://auth/callback${params}`;
          return;
        }

        // لا tokens — ارجع للصفحة الرئيسية
        router.replace('/');
        return;
      }

      // ── على الجهاز (Native) ──
      // أغلق المتصفح
      try { await Browser.close(); } catch {}

      // استمع للـ Deep Link القادم
      const listener = await App.addListener('appUrlOpen', async ({ url }) => {
        listener.remove();

        if (url.includes('auth/callback')) {
          const fragment = url.includes('#')
            ? url.split('#')[1]
            : url.split('?')[1];

          if (fragment) {
            try {
              await supabase.auth.exchangeCodeForSession(
                `${window.location.origin}/auth/callback#${fragment}`
              );
            } catch {}
          }
        }
        await redirect();
      });

      // timeout 20 ثانية
      setTimeout(async () => {
        listener.remove();
        await redirect();
      }, 20000);
    };

    const redirect = async () => {
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