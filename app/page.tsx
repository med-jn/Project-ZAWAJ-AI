'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';

const ADMIN_EMAIL = 'mohamed.jouini029@gmail.com';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user || null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_completed')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!profile?.is_completed) {
          router.push('/onboarding');
        } else {
          router.push('/home');
        }
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080008]">
        <div className="text-[#c0002a] font-black text-2xl tracking-[0.3em] animate-pulse">
          ZAWAJ AI...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
      {/* الخلفية المتحركة التي عرفتها في globals.css */}
      <div className="main-bg"></div>

      {/* البطاقة الزجاجية باستخدام الكلاس الخاص بك */}
      <section className="glass-panel w-full max-w-[420px] p-10 md:p-12 text-center relative z-10 border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        
        {/* أيقونة الخاتم بتأثير العوم */}
        <div className="text-5xl mb-6 animate-[floating_3s_ease-in-out_infinite] inline-block">
          💍
        </div>

        {/* الشعار المعتمد على خط Cairo تلقائياً */}
        <h1 className="text-5xl font-black mb-2 tracking-tighter">
          <span className="text-white">ZAWAJ </span>
          <span className="text-[#c0002a] drop-shadow-[0_0_20px_rgba(192,0,42,0.6)]">AI</span>
        </h1>

        <p className="text-white/60 text-sm italic font-medium mb-1">مستقبل الزواج الذكي</p>
        <p className="text-white/30 text-[11px] tracking-widest uppercase mb-8">ابحث عن نصفك الآخر بذكاء وأمان</p>

        {/* خط فاصل جمالي */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#c0002a]/40" />
          <span className="text-[#c0002a] text-xs">❤</span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#c0002a]/40" />
        </div>

        {!user ? (
          <div className="space-y-6">
            {/* زر جوجل المحسن - تم تكبير الخط وتوضيحه */}
            <button
              onClick={handleLogin}
              className="w-full py-4 px-6 rounded-full bg-white text-black flex items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-xl group"
            >
              <svg width="24" height="24" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              <span className="text-lg font-black tracking-tight">الدخول عبر جوجل</span>
            </button>

<button
  onClick={() => router.push('/register')}
  className="w-full py-4 px-6 rounded-full border border-[#c0002a]/40 text-white flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:bg-[#c0002a]/10"
>
  <span className="text-xl">✉️</span>
  <span className="text-lg font-black tracking-tight">التسجيل بالبريد الإلكتروني</span>
</button>

            <p className="text-white/20 text-[10px] leading-relaxed">
              بتسجيل دخولك توافق على سياسة الخصوصية <br /> وشروط الاستخدام المعتمدة
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 animate-fadeIn">
            <div className="relative group">
              <img
                src={user.user_metadata?.avatar_url}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-[#c0002a]/80 p-1 shadow-[0_0_30px_rgba(192,0,42,0.4)] transition-transform group-hover:rotate-6"
              />
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-[#080008] rounded-full" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">أهلاً بك، {user.user_metadata?.full_name?.split(' ')[0]} 👋</h2>
              <p className="text-white/50 text-sm">جاهز للعثور على نصفك الآخر؟</p>
            </div>

            <button
              onClick={() => router.push('/onboarding')}
              className="btn-premium w-full py-4 text-lg !bg-gradient-to-r from-[#800020] to-[#c0002a] shadow-[0_10px_30px_rgba(128,0,32,0.5)]"
            >
              استكمال الملف الشخصي
            </button>

            {user.email === ADMIN_EMAIL && (
              <button
                onClick={() => router.push('/admin')}
                className="w-full py-3 rounded-full border border-[#c0002a]/30 text-[#c0002a] font-bold text-sm hover:bg-[#c0002a]/10 transition-colors"
              >
                ⚙️ لوحة التحكم
              </button>
            )}
          </div>
        )}

        <p className="mt-12 text-white/10 text-[9px] tracking-[0.4em] uppercase">
          Secured by Supabase & AI Logic
        </p>
      </section>
    </main>
  );
}