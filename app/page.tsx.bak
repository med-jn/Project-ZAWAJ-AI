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

// نُسجّل دالة التنقل في window حتى يستطيع Java استدعاؤها (Warm Start)
if (typeof window !== 'undefined') {
  (window as any).__navigateTo = null; // سيُعيَّن بعد جاهزية router
}

export default function LandingPage() {
  const [loading, setLoading]             = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router                            = useRouter();

  // ── تسجيل __navigateTo فور جاهزية router ──────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__navigateTo = (route: string) => {
      if (route && route.startsWith('/')) {
        router.push(route);
      }
    };
    return () => { (window as any).__navigateTo = null; };
  }, [router]);

  // ── التحقق من الجلسة + Cold Start ─────────────────────────
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }

        // ✅ Cold Start: افحص window.__pendingRoute الذي وضعه MainActivity
        if (Capacitor.getPlatform() === 'android') {
          const pendingRoute = (window as any).__pendingRoute;
          if (pendingRoute && pendingRoute.startsWith('/')) {
            (window as any).__pendingRoute = null;
            router.push(pendingRoute);
            return;
          }
        }

        // التدفق الطبيعي
        try {
          const { data: profile } = await supabase
            .from('profiles').select('is_completed')
            .eq('id', session.user.id).maybeSingle();
          router.push(profile?.is_completed ? '/home' : '/onboarding');
        } catch {
          router.push('/home');
        }

      } catch {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  // ── Warm Start + OAuth ─────────────────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('appUrlOpen', async ({ url }) => {
      // OAuth callback
      if (url.includes('auth/callback')) {
        setGoogleLoading(false);
        try {
          const hashPart      = url.split('#')[1] || url.split('?')[1] || '';
          const params        = new URLSearchParams(hashPart);
          const access_token  = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
          } else {
            const code = params.get('code');
            if (code) await supabase.auth.exchangeCodeForSession(url);
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
        return;
      }

      // ✅ Warm Start من إشعار: zawaj://app/chat/?id=X
      try {
        const uri   = new URL(url);
        if (uri.protocol === 'zawaj:' && uri.hostname === 'app') {
          const route = uri.pathname + uri.search;
          if (route && route !== '/') router.push(route);
        }
      } catch (_) {}
    });

    return () => { listener.then(l => l.remove()); };
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: isNative
            ? 'com.zawaj.ai://auth/callback'
            : 'https://zawaj-ai.vercel.app/auth/callback',
          skipBrowserRedirect: isNative,
        },
      });
      if (error) throw error;
      if (isNative && data?.url) {
        setGoogleLoading(true);
        await Browser.open({ url: data.url, windowName: '_blank', presentationStyle: 'popover' });
      }
    } catch (error: any) {
      setGoogleLoading(false);
      toast.error('حدث خطأ: ' + error.message);
    }
  };

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
          color: 'var(--text-tertiary)', opacity: 0.6, lineHeight: 'var(--lh-relaxed)' }}>
         بتسجيل دخولك توافق على سياسات الخصوصية وشروط الاستخدام
        </p>
        <Footer />
      </section>
    </main>
  );
}