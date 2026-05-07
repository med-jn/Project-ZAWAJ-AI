'use client';
import { useState }  from 'react';
import { useRouter } from 'next/navigation';
import { supabase }  from '@/lib/supabase/client';
import { Brand }     from '@/components/ui/brand';
import Footer        from '@/components/layout/Footer';
import { Eye, EyeOff, Mail, Lock, ArrowRight, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [emailSent, setEmailSent]           = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!email.trim() || !password || !confirmPassword) { setError('يرجى ملء جميع الحقول'); return; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin + '/auth/callback' },
    });

    if (signUpError) {
      setError(signUpError.message.includes('already')
        ? 'هذا البريد مسجل مسبقاً — جرب تسجيل الدخول'
        : 'حدث خطأ: ' + signUpError.message);
      setLoading(false); return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert(
        { id: data.user.id, created_at: new Date().toISOString(), is_completed: false },
        { onConflict: 'id' }
      );
      if (data.session) { router.push('/onboarding'); }
      else { setEmailSent(true); }
    }
    setLoading(false);
  };

  // ── شاشة تأكيد البريد ────────────────────────────────────
  if (emailSent) {
    return (
      <main style={{
        minHeight: '100dvh', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--sp-8)',
      }} className="bg-luxury-gradient">
        <section className="glass-panel" style={{
          width: '100%', maxWidth: 420,
          padding: 'var(--sp-10)', textAlign: 'center',
        }}>
          <div style={{
            width: '5rem', height: '5rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-soft)',
            border: '1px solid var(--border-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--sp-6)',
          }}>
            <Mail size={32} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--text-main)', marginBottom: 'var(--sp-3)' }}>
            تحقق من بريدك
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-2)' }}>
            أرسلنا رابط التأكيد إلى
          </p>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--sp-8)', wordBreak: 'break-all' }}>
            {email}
          </p>
          <button
            onClick={() => setEmailSent(false)}
            style={{
              width: '100%', height: 'var(--btn-h)',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              border: '1px solid var(--border-soft)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            تغيير البريد الإلكتروني
          </button>
        </section>
      </main>
    );
  }

  // ── الحقل المشترك ─────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    direction: 'ltr',
    width: '100%',
    padding: 'var(--sp-4) var(--sp-4) var(--sp-4) 3rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-main)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  };

  return (
    <main style={{
      minHeight: '100dvh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--sp-8)', position: 'relative', overflow: 'hidden',
    }} className="bg-luxury-gradient">

      {/* ── زر الرجوع ── */}
      <button
        onClick={() => router.push('/')}
        style={{
          position: 'fixed',
          top: 'calc(var(--safe-top, 0px) + var(--sp-4))',
          right: 'var(--sp-4)',
          zIndex: 100,
          width: '2.5rem', height: '2.5rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-main)',
        }}
      >
        <ArrowRight size={18} />
      </button>

      <section className="glass-panel" style={{
        width: '100%', maxWidth: 420,
        padding: 'var(--sp-10)', textAlign: 'center',
        position: 'relative', zIndex: 10,
      }}>

        {/* ── الهيدر ── */}
        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <Brand />
          <p style={{
            marginTop: 'var(--sp-3)', fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)', opacity: 0.8,
            lineHeight: 'var(--lh-relaxed)',
          }}>
            إنشاء حساب جديد
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)', textAlign: 'right' }}>

          {/* البريد */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
              البريد الإلكتروني
            </label>
            <div style={{ position: 'relative' }}>
              <input type="email" placeholder="example@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
              />
              <Mail size={16} style={{ position: 'absolute', left: 'var(--sp-4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* كلمة المرور */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} placeholder="6 أحرف على الأقل"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '3rem' }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
              />
              <Lock size={16} style={{ position: 'absolute', left: 'var(--sp-4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <button onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 'var(--sp-4)', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
              تأكيد كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} placeholder="أعد كتابة كلمة المرور"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
              />
              <Lock size={16} style={{ position: 'absolute', left: 'var(--sp-4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* الخطأ */}
          {error && (
            <div style={{
              background: 'rgba(179,51,75,0.1)',
              border: '1px solid rgba(179,51,75,0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--sp-3) var(--sp-4)',
            }}>
              <p style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', margin: 0, textAlign: 'center' }}>
                {error}
              </p>
            </div>
          )}

          {/* زر الإنشاء */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="btn-premium"
            style={{
              width: '100%', height: 'var(--btn-h-lg)',
              fontSize: 'var(--text-base)', gap: 'var(--sp-3)',
              marginTop: 'var(--sp-2)', opacity: loading ? 0.7 : 1,
            }}
          >
            <UserPlus size={18} />
            {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          </button>

          {/* الفاصل */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
            <div style={{ height: 1, flex: 1, background: 'var(--glass-border)' }} />
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>لديك حساب بالفعل؟</span>
            <div style={{ height: 1, flex: 1, background: 'var(--glass-border)' }} />
          </div>

          {/* زر الدخول */}
          <button
            onClick={() => router.push('/login')}
            style={{
              width: '100%', height: 'var(--btn-h)',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              border: '1px solid var(--border-soft)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'var(--color-primary)';
              (e.target as HTMLButtonElement).style.color = 'var(--color-primary)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'var(--border-soft)';
              (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            تسجيل الدخول
          </button>

        </div>

        <p style={{
          marginTop: 'var(--sp-8)', fontSize: 'var(--text-2xs)',
          color: 'var(--text-tertiary)', opacity: 0.4, lineHeight: 'var(--lh-relaxed)',
        }}>
          بإنشاء حسابك توافق على سياسة الخصوصية وشروط الاستخدام
        </p>
        <Footer />
      </section>
    </main>
  );
}