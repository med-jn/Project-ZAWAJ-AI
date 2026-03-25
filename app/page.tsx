'use client';
/**
 * 📁 app/page.tsx — ZAWAJ AI
 * ✅ إصلاح: loading تنتهي دائماً حتى عند الخطأ
 * ✅ إصلاح: timeout يمنع الـ splash اللانهائي
 */
import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { supabase }            from '@/lib/supabase/client';
import { Brand }               from '@/components/ui/brand';
import { GoogleButton }        from '@/components/ui/googlebutton';
import { Mail }                from 'lucide-react';
import { toast }               from 'sonner';

export default function LandingPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // timeout يمنع التعليق اللانهائي إذا فشل Supabase
        const timeout = new Promise<null>(res => setTimeout(() => res(null), 5000));
        const authPromise = supabase.auth.getUser();
        const result = await Promise.race([authPromise, timeout]);

        // إذا انتهى الـ timeout
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
          // لا نضع setLoading(false) هنا — الصفحة ستتغير
        } else {
          setLoading(false);
        }
      } catch {
        // أي خطأ — أظهر الصفحة
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
      const isMobileApp = window.location.protocol === 'capacitor:';
      const redirectUrl  = isMobileApp
        ? 'com.zawaj.ai://auth/callback'
        : window.location.origin + '/auth/callback';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: false },
      });
      if (error) throw error;
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
        <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--sp-8)' }}
          className="animate-float">💍</div>

        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <Brand />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 'var(--sp-8)', marginBottom: 'var(--sp-8)',
        }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border-soft)' }} />
          <span style={{
            fontSize: 'var(--text-sm)', fontWeight: 700,
            color: 'var(--text-tertiary)',
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
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>email</span>
          </button>
        </div>

        <p style={{
          marginTop: 'var(--sp-8)', fontSize: 'var(--text-2xs)',
          color: 'var(--text-tertiary)', opacity: 0.4,
          lineHeight: 'var(--lh-relaxed)',
        }}>
          بتسجيل دخولك توافق على سياسة الخصوصية وشروط الاستخدام
        </p>
      </section>
    </main>
  );
}