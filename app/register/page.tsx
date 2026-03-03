'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!email.trim() || !password || !confirmPassword) { setError('يرجى ملء جميع الحقول'); return; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin + '/auth/callback' }
    });

    if (signUpError) {
      setError(signUpError.message.includes('already') ? 'هذا البريد مسجل مسبقاً — جرب تسجيل الدخول' : 'حدث خطأ: ' + signUpError.message);
      setLoading(false); return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert(
        { id: data.user.id, created_at: new Date().toISOString(), is_completed: false },
        { onConflict: 'id' }
      );
      if (data.session) {
        router.push('/onboarding');
      } else {
        setEmailSent(true);
      }
    }
    setLoading(false);
  };

  if (emailSent) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-luxury-gradient">
        <div className="main-bg" />
        <section className="glass-panel w-full max-w-[420px] p-10 text-center relative z-10">
          <div className="text-5xl mb-6">📬</div>
          <h2 className="text-2xl font-black text-white mb-3">تحقق من بريدك</h2>
          <p className="text-white/50 text-sm mb-2">أرسلنا رابط التأكيد إلى</p>
          <p className="text-[#c0002a] font-bold text-sm mb-6 break-all">{email}</p>
          <button onClick={() => setEmailSent(false)}
            className="w-full py-3 rounded-full border border-white/15 text-white/50 text-sm hover:border-white/30 transition-all">
            ← تغيير البريد الإلكتروني
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
      <div className="main-bg" />
      <section className="glass-panel w-full max-w-[420px] p-10 text-center relative z-10 border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">

        <div className="text-4xl mb-4 inline-block">💍</div>
        <h1 className="text-4xl font-black mb-1 tracking-tighter">
          <span className="text-white">ZAWAJ </span>
          <span className="text-[#c0002a] drop-shadow-[0_0_20px_rgba(192,0,42,0.6)]">AI</span>
        </h1>
        <p className="text-white/50 text-sm mb-6">إنشاء حساب جديد</p>

        <div className="space-y-4 text-right">
          <div>
            <label className="text-white/50 text-xs mb-1 block">البريد الإلكتروني</label>
            <input type="email" placeholder="example@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ direction: 'ltr' }}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-[#c0002a]/60 transition-all text-sm" />
          </div>

          <div>
            <label className="text-white/50 text-xs mb-1 block">كلمة المرور</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} placeholder="6 أحرف على الأقل"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ direction: 'ltr' }}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-[#c0002a]/60 transition-all text-sm" />
              <button onClick={() => setShowPass(p => !p)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-white/50 text-xs mb-1 block">تأكيد كلمة المرور</label>
            <input type={showPass ? 'text' : 'password'} placeholder="أعد كتابة كلمة المرور"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              style={{ direction: 'ltr' }}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none focus:border-[#c0002a]/60 transition-all text-sm" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button onClick={handleRegister} disabled={loading}
            className="w-full py-4 rounded-full font-black text-lg text-white transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 mt-2"
            style={{ background: 'linear-gradient(135deg, #800020, #c0002a)', boxShadow: '0 10px 30px rgba(128,0,32,0.5)' }}>
            {loading ? '⏳ جاري الإنشاء...' : '✨ إنشاء الحساب'}
          </button>

          <button onClick={() => router.push('/login')}
            className="w-full py-3 rounded-full border border-white/15 text-white/50 text-sm hover:border-white/30 transition-all">
            🚪 تسجيل الدخول
          </button>

          <button onClick={() => router.push('/')}
            className="w-full py-2 text-white/25 text-xs hover:text-white/45 transition-colors">
            العودة للصفحة الرئيسية
          </button>
        </div>
      </section>
    </main>
  );
}