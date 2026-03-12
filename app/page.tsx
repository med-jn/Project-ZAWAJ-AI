'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LandingPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('is_completed')
          .eq('id', user.id).maybeSingle();
        router.push(profile?.is_completed ? '/home' : '/onboarding');
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleGoogleLogin = async () => {
  const isMobileApp = window.location.protocol === 'capacitor:';

  const redirectUrl = isMobileApp
    ? 'com.zawaj.ai://auth/callback'
    : window.location.origin + '/auth/callback';

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: false,
    },
  });
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080008]">
        <div className="text-[#c0002a] font-black text-2xl tracking-[0.3em] animate-pulse">ZA AI...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-luxury-gradient absolute inset-0 z-0" />
      <section className="glass-panel w-full max-w-[420px] p-10 md:p-12 text-center relative z-10 border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        
        <div className="text-5xl mb-6 animate-[floating_3s_ease-in-out_infinite] inline-block">💍</div>
        <h1 className="text-4xl font-black mb-2 tracking-tighter">
          <span className="text-white">ZAWAJ </span>
          <span className="text-[#c0002a] drop-shadow-[0_0_20px_rgba(192,0,42,0.6)]">AI</span>
        </h1>
        <p className="text-white/70 text-sm font-medium mb-1">مستقبل الزواج الذكي</p>
        <p className="text-white/30 text-[16px] tracking-widest uppercase mb-8">ابحث عن نصفك الآخر بذكاء وأمان</p>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#c0002a]/40" />
          <span className="text-[#c0002a] text-xs">❤</span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#c0002a]/40" />
        </div>

        <div className="space-y-4">
          <button onClick={handleGoogleLogin}
            className="w-full py-4 px-6 rounded-full bg-white text-black flex items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-xl">
            <svg width="24" height="24" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            <span className="text-xl font-bold tracking-tight">Google</span>
          </button>

          <button onClick={() => router.push('/login')}
            className="w-full py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.03] active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1a3a8f, #2563eb)', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
            <span className="text-xl">✉️</span>
            <span className="text-xl font-bold tracking-tight text-white">Email</span>
          </button>
        </div>

        <p className="mt-8 text-white/20 text-[10px] leading-relaxed">
          بتسجيل دخولك توافق على سياسة الخصوصية وشروط الاستخدام
        </p>
      </section>
    </main>
  );
}