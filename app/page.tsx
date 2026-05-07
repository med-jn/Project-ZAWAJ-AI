'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter }                   from 'next/navigation';
import { supabase }                    from '@/lib/supabase/client';
import { Brand }                       from '@/components/ui/brand';
import { GoogleButton }                from '@/components/ui/googlebutton';
import { Mail }                        from 'lucide-react';
import { toast }                       from 'sonner';
import { Capacitor }                   from '@capacitor/core';
import { Browser }                     from '@capacitor/browser';
import Footer                          from '@/components/layout/Footer';

export default function LandingPage() {
  const [loading, setLoading]             = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router                            = useRouter();
  const browserListenerRef                = useRef<any>(null);

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

  useEffect(() => {
    return () => { browserListenerRef.current?.remove(); };
  }, []);

  const waitForSessionAfterBrowser = async () => {
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setGoogleLoading(false);
        try {
          const { data: profile } = await supabase
            .from('profiles').select('is_completed')
            .eq('id', session.user.id).maybeSingle();
          router.push(profile?.is_completed ? '/home' : '/onboarding');
        } catch { router.push('/home'); }
        return;
      }
    }
    setGoogleLoading(false);
    toast.error('لم يتم تسجيل الدخول، حاول مجدداً');
  };

  const handleGoogleLogin = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://zawaj-ai.vercel.app/auth/callback',
          skipBrowserRedirect: isNative,
        },
      });
      if (error) throw error;
      if (isNative && data?.url) {
        setGoogleLoading(true);
        browserListenerRef.current = await Browser.addListener(
          'browserFinished',
          () => {
            browserListenerRef.current?.remove();
            waitForSessionAfterBrowser();
          }
        );
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
        fontWeight: 900, letterSpacing: '0.15em', animation: 'pulse 1.5s ease-in-out infinite' }}>
        ZAWAJ AI
      </div>
      {msg && <p style={{ color: '#fff', fontSize: 'var(--text-sm)', margin: 0 }}>{msg}</p>}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
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
            color: 'var(--text-secondary)', textTransform: 'uppercase' }}>تسجيل الدخول عبر</span>
          <div style={{ height: 1, flex: 1, background: 'var(--border-soft)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <GoogleButton onClick={handleGoogleLogin} />
          <button onClick={() => router.push('/login')} className="btn-premium"
            style={{ width: '100%', background: 'var(--color-primary)',
              border: '1px solid var(--border-soft)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-4)' }}>
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