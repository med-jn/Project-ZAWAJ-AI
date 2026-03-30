'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { supabase }            from '@/lib/supabase/client';
import { Brand }               from '@/components/ui/brand';
import { GoogleButton }        from '@/components/ui/googlebutton';
import { Mail }                from 'lucide-react';
import { toast }               from 'sonner';
import { Capacitor }          from '@capacitor/core';
import { Browser }            from '@capacitor/browser';
import Footer from '@/components/layout/Footer';

export default function LandingPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const timeout = new Promise<null>(res => setTimeout(() => res(null), 5000));
        const authPromise = supabase.auth.getUser();
        const result = await Promise.race([authPromise, timeout]);

        if (!result || !('data' in result)) {
          setLoading(false);
          return;
        }

        const { data } = result;
        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles').select('is_completed')
            .eq('id', data.user.id).maybeSingle();
          
          router.push(profile?.is_completed ? '/home' : '/onboarding');
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }} className="bg-luxury-gradient">
        <div style={{
          color: 'var(--color-primary)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 900,
          letterSpacing: '0.15em',
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

  const handleGoogleLogin = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();

      const redirectUrl = isNative
        ? 'com.zawaj.ai://auth/callback'   // custom scheme للتطبيق
        : window.location.origin + '/auth/callback';

      if (isNative) {
        // ── Capacitor: نفتح OAuth داخل التطبيق بـ @capacitor/browser ──
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,  // ✅ نمنع فتح المتصفح الخارجي
          },
        });
        if (error) throw error;

        // نفتح URL الـ OAuth في متصفح داخلي
        if (data?.url) {
          await Browser.open({
            url: data.url,
            windowName: '_self',
            presentationStyle: 'popover',
          });
        }
      } else {
        // ── Web: السلوك العادي ──
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: redirectUrl },
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error('حدث خطأ أثناء تسجيل الدخول: ' + error.message);
    }
  };

  return (
    <main className="bg-luxury-gradient" style={{
      minHeight: '100dvh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-8)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <section className="glass-panel" style={{
        width: '100%',
        maxWidth: 420,
        padding: 'var(--sp-10)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
      }}>

        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <Brand />
        
                <p style={{
          marginTop: 'var(--sp-3)', fontSize: 'var(--text-xs)',
          color: 'var(--text-primary)', opacity: 0.8,
          lineHeight: 'var(--lh-relaxed)',
        }}>
          ابحث عن شريك حياتك بآمان وذكاء
        </p>
        </div>


        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 'var(--sp-8)', marginBottom: 'var(--sp-8)',
        }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border-soft)' }} />
          <span style={{
            fontSize: 'var(--text-sm)', fontWeight: 700,
            color: 'var(--text-secondary)', textTransform: 'uppercase',
          }}> تسجيل الدخول عبر</span>
          <div style={{ height: 1, flex: 1, background: 'var(--border-soft)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <GoogleButton onClick={handleGoogleLogin} />

          <button onClick={() => router.push('/login')} className="btn-premium"
            style={{ width: '100%', background: 'var(--color-primary)',
              border: '1px solid var(--border-soft)', color: 'white',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 'var(--sp-4)',
            }}>
            <Mail style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
            <span className="font-bold text-md">email</span>
          </button>
        </div>

        <p style={{
          marginTop: 'var(--sp-8)', fontSize: 'var(--text-2xs)',
          color: 'var(--text-tertiary)', opacity: 0.4,
          lineHeight: 'var(--lh-relaxed)',
        }}>
          بتسجيل دخولك توافق على سياسة الخصوصية وشروط الاستخدام
        </p>
        <Footer />
      </section>
    </main>
  );
}