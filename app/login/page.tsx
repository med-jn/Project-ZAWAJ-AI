'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Footer from '@/components/layout/Footer';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) { setError('يرجى ملء جميع الحقول'); return; }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError('البريد أو كلمة المرور غير صحيحة');
      setLoading(false); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('is_completed').eq('id', user!.id).maybeSingle();
    router.push(profile?.is_completed ? '/home' : '/onboarding');
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
      <div className="main-bg" />
      <section className="glass-panel bg-card w-full max-w-[420px] p-10 text-center relative z-10 border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">

        <div className="text-4xl mb-4 inline-block">💍</div>
        <h1 className="text-4xl font-black mb-1 tracking-tighter">
          <span className="text-white">ZAWAJ </span>
          <span className="text-[#c0002a] drop-shadow-[0_0_20px_rgba(192,0,42,0.6)]">AI</span>
        </h1>
        <p className="text-white/50 text-sm mb-6">تسجيل الدخول بالبريد الإلكتروني</p>

        <div className="space-y-4 text-right">
          <div>
            <label className="text-white/50 text-xs mb-1 block">البريد الإلكتروني</label>
            <input type="email" placeholder="example@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ direction: 'ltr' }}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-[#c0002a]/60 transition-all text-sm" />
          </div>

          <div>
            <label className="text-white/50 text-xs mb-1 block">كلمة المرور</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} placeholder="أدخل كلمة المرور"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ direction: 'ltr' }}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-[#c0002a]/60 transition-all text-sm" />
              <button onClick={() => setShowPass(p => !p)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-4 rounded-full font-black text-lg text-white transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-50 mt-2"
            style={{ background: 'linear-gradient(135deg, #800020, #c0002a)', boxShadow: '0 10px 30px rgba(128,0,32,0.5)' }}>
            {loading ? '⏳ جاري الدخول...' : '🚪 دخول'}
          </button>

          <div className="flex items-center gap-3 pt-1">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-white/20 text-xs">ليس لديك حساب؟</span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <button onClick={() => router.push('/register')}
            className="w-full py-3 rounded-full border border-white/15 text-white/50 text-sm font-medium hover:border-white/30 hover:text-white/70 transition-all">
            ✨ إنشاء حساب جديد
          </button>

          <button onClick={() => router.push('/')}
            className="w-full py-2 text-white/25 text-xs hover:text-white/45 transition-colors">
            ← العودة للصفحة الرئيسية
          </button>
        </div>
      </section>
      <Footer />
    </main>
  );
}