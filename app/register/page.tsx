'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!email || !password || !confirmPassword) {
      setError('يرجى ملء جميع الحقول'); return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين'); return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: undefined }
    });
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('هذا البريد مسجل مسبقاً، جرب تسجيل الدخول');
      } else {
        setError('حدث خطأ، حاول مجدداً');
      }
      setLoading(false); return;
    }
    if (data.user) {
      router.push('/onboarding');
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
      <div className="main-bg" />

      <section className="glass-panel w-full max-w-[420px] p-10 text-center relative z-10 border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">

        {/* الشعار */}
        <div className="text-4xl mb-4 inline-block">💍</div>
        <h1 className="text-4xl font-black mb-1 tracking-tighter">
          <span className="text-white">ZAWAJ </span>
          <span className="text-[#c0002a] drop-shadow-[0_0_20px_rgba(192,0,42,0.6)]">AI</span>
        </h1>
        <p className="text-white/50 text-sm mb-8">إنشاء حساب جديد</p>

        {/* الفاصل */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#c0002a]/40" />
          <span className="text-[#c0002a] text-xs">❤</span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#c0002a]/40" />
        </div>

        <div className="space-y-4 text-right">

          {/* البريد الإلكتروني */}
          <div>
            <label className="text-white/50 text-xs mb-1 block">البريد الإلكتروني</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              style={{ direction: 'ltr' }}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-[#c0002a]/60 focus:bg-white/8 transition-all text-sm"
            />
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="text-white/50 text-xs mb-1 block">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="6 أحرف على الأقل"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                style={{ direction: 'ltr' }}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-[#c0002a]/60 transition-all text-sm"
              />
              <button
                onClick={() => setShowPass(p => !p)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors text-xs"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="text-white/50 text-xs mb-1 block">تأكيد كلمة المرور</label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="أعد كتابة كلمة المرور"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              style={{ direction: 'ltr' }}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-[#c0002a]/60 transition-all text-sm"
            />
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* زر التسجيل */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-4 rounded-full font-black text-lg text-white transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            style={{ background: 'linear-gradient(135deg, #800020, #c0002a)', boxShadow: '0 10px 30px rgba(128,0,32,0.5)' }}
          >
            {loading ? '⏳ جاري الإنشاء...' : '✨ إنشاء الحساب'}
          </button>

          {/* رابط العودة */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-white/20 text-xs">أو</span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-full border border-white/10 text-white/40 text-sm font-medium hover:border-white/25 hover:text-white/60 transition-all"
          >
            ← العودة لتسجيل الدخول
          </button>
        </div>

        <p className="mt-8 text-white/10 text-[9px] tracking-[0.4em] uppercase">
          Secured by Supabase & AI Logic
        </p>
      </section>
    </main>
  );
}