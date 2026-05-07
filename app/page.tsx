'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { supabase }            from '@/lib/supabase/client';
import { Brand }               from '@/components/ui/brand';
import { GoogleButton }        from '@/components/ui/googlebutton';
import { Mail }                from 'lucide-react';
import { toast }               from 'sonner';
import { Capacitor }           from '@capacitor/core';
import { Browser }             from '@capacitor/browser';
import { App }                 from '@capacitor/app';
import Footer                  from '@/components/layout/Footer';

export default function LandingPage() {
  const [loading, setLoading]             = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router                            = useRouter();

  // ── التحقق من الجلسة عند فتح التطبيق ─────────────────────
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }
        try {
          const { data: profile } = await supabase
            .from('profiles').select('is_completed')
            .eq('id', session.user.id).maybeSingle();
          router.push(profile?.is_completed ? '/home' : '/onboarding');
        } catch { router.push('/home'); }
      } catch { setLoading(false); }
    };
    checkUser();
  }, [router]);

  // ── استقبال Deep Link عند عودة التطبيق من OAuth ──────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('appUrlOpen', async ({ url }) => {
      // url = "com.zawaj.ai://auth/callback#access_token=...&refresh_token=..."
      if (!url.includes('auth/callback')) return;

      setGoogleLoading(false);

      try {
        // استخرج الـ tokens من الـ URL
        const hashPart   = url.split('#')[1] || url.split('?')[1] || '';
        const params     = new URLSearchParams(hashPart);
        const access_token  = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        } else {
          // PKCE flow — exchangeCodeForSession
          const code = params.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(url);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try {
            const { data: profile } = await supabase
              .from('profiles').select('is_completed')
              .eq('id', session.user.id).maybeSingle();
            router.push(profile?.is_completed ? '/home' : '/onboarding');
          } catch { router.push('/home'); }
        }
      } catch (e: any) {
        toast.error('خطأ في تسجيل الدخول: ' + e.message);
      }
    });

    return () => { listener.then(l => l.remove()); };
  }, [router]);

  // ── Google Login ──────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // ✅ على Native: أرسل مباشرة للـ deep link — Android يفتح التطبيق تلقائياً
          // ✅ على Web: أرسل لـ Vercel كالمعتاد
          redirectTo: isNative
            ? 'com.zawaj.ai://auth/callback'
            : 'https://zawaj-ai.vercel.app/auth/callback',
          skipBrowserRedirect: isNative,
        },
      });
      if (error) throw error;

      if (isNative && data?.url) {
        setGoogleLoading(true);
        await Browser.open({
          url: data.url,
          windowName: '_blank',
          presentationStyle: 'popover',
        });
      }

    } catch (error: any) {
      setGoogleLoading(false);
      toast.error('حدث خطأ: ' + error.message);
    }
  };

  // ── شاشة التحميل ─────────────────────────────────────────
  const spinnerScreen = (msg: string) => (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px' }}
      className="bg-luxury-gradient">
      <div style={{ color: 'var(--color-primary)', fontSize: 'var(--text-2xl)',
        fontWeight: 900, letterSpacing: '0.15em',
        animation: 'pulse 1.5s ease-in-out infinite' }}>
        ZAWAJ AI
      </div>
      {msg && <p style={{ color: '#fff', fontSize: 'var(--text-sm)', margin: 0 }}>{msg}</p>}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );

  if (loading)       return spinnerScreen('');
  if (googleLoading) return spinnerScreen('جاري تسجيل الدخول...');

  // ── الصفحة الرئيسية ──────────────────────────────────────
  return (
    <main className="bg-luxury-gradient" style={{
      minHeight: '100dvh', width: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 'var(--sp-8)', position: 'relative', overflow: 'hidden',
    }}>
      <section className="glass-panel" style={{
        width: '100%', maxWidth: 420, padding: 'var(--sp-10)',
        textAlign: 'center', position: 'relative', zIndex: 10,
      }}>
        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <Brand />
          <p style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--text-xs)',
            color: 'var(--text-primary)', opacity: 0.8, lineHeight: 'var(--lh-relaxed)' }}>
            ابحث عن شريك حياتك بآمان وذكاء
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center',
          gap: 'var(--sp-8)', marginBottom: 'var(--sp-8)' }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border-soft)' }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700,
            color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            تسجيل الدخول عبر
          </span>
          <div style={{ height: 1, flex: 1, background: 'var(--border-soft)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <GoogleButton onClick={handleGoogleLogin} />
          <button onClick={() => router.push('/login')} className="btn-premium"
            style={{ width: '100%', background: 'var(--color-primary)',
              border: '1px solid var(--border-soft)', color: 'white',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 'var(--sp-4)' }}>
            <Mail style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
            <span className="font-bold text-md">email</span>
          </button>
        </div>

        <p style={{ marginTop: 'var(--sp-8)', fontSize: 'var(--text-2xs)',
          color: 'var(--text-tertiary)', opacity: 0.4, lineHeight: 'var(--lh-relaxed)' }}>
          بتسجيل دخولك توافق على سياسة الخصوصية وشروط الاستخدام
        </p>
        <Footer />
      </section>
    </main>
  );
}