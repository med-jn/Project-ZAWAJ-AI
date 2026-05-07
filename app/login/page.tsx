'use client';
import { useState }      from 'react';
import { useRouter }     from 'next/navigation';
import { supabase }      from '@/lib/supabase/client';
import { Brand }         from '@/components/ui/brand';
import Footer            from '@/components/layout/Footer';
import { Eye, EyeOff, Mail, Lock, ArrowRight, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) { setError('يرجى ملء جميع الحقول'); return; }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(), password,
    });
    if (signInError) {
      setError('البريد أو كلمة المرور غير صحيحة');
      setLoading(false); return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles').select('is_completed')
        .eq('id', session.user.id).maybeSingle();
      router.push(profile?.is_completed ? '/home' : '/onboarding');
    }
    setLoading(false);
  };

  return (
    <main style={{
      minHeight: '100dvh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-8)',
      position: 'relative',
      overflow: 'hidden',
    }} className="bg-luxury-gradient">

      {/* ── زر الرجوع ── */}
      <button
        onClick={() => router.push('/')}
        style={{
          position: 'fixed',
          top: 'calc(var(--safe-top, 0px) + var(--sp-4))',
          right: 'var(--sp-4)',
          zIndex: 100,
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-main)',
        }}
      >
        <ArrowRight size={18} />
      </button>

      <section className="glass-panel" style={{
        width: '100%',
        maxWidth: 420,
        padding: 'var(--sp-10)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* ── الهيدر ── */}
        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <Brand />
          <p style={{
            marginTop: 'var(--sp-3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            opacity: 0.8,
            lineHeight: 'var(--lh-relaxed)',
          }}>
            تسجيل الدخول بالبريد الإلكتروني
          </p>
        </div>

        {/* ── الحقول ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)', textAlign: 'right' }}>

          {/* البريد */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              marginBottom: 'var(--sp-2)',
              fontWeight: 600,
            }}>
              البريد الإلكتروني
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{
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
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
              />
              <Mail size={16} style={{
                position: 'absolute',
                left: 'var(--sp-4)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
              }} />
            </div>
          </div>

          {/* كلمة المرور */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              marginBottom: 'var(--sp-2)',
              fontWeight: 600,
            }}>
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{
                  direction: 'ltr',
                  width: '100%',
                  padding: 'var(--sp-4) 3rem var(--sp-4) 3rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-main)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
              />
              <Lock size={16} style={{
                position: 'absolute',
                left: 'var(--sp-4)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
              }} />
              <button
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute',
                  right: 'var(--sp-4)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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

          {/* زر الدخول */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-premium"
            style={{
              width: '100%',
              height: 'var(--btn-h-lg)',
              fontSize: 'var(--text-base)',
              gap: 'var(--sp-3)',
              marginTop: 'var(--sp-2)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <LogIn size={18} />
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>

          {/* الفاصل */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
            <div style={{ height: 1, flex: 1, background: 'var(--glass-border)' }} />
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
              ليس لديك حساب؟
            </span>
            <div style={{ height: 1, flex: 1, background: 'var(--glass-border)' }} />
          </div>

          {/* زر التسجيل */}
          <button
            onClick={() => router.push('/register')}
            style={{
              width: '100%',
              height: 'var(--btn-h)',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              border: '1px solid var(--border-soft)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
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
            إنشاء حساب جديد
          </button>

        </div>

        <p style={{
          marginTop: 'var(--sp-8)',
          fontSize: 'var(--text-2xs)',
          color: 'var(--text-tertiary)',
          opacity: 0.4,
          lineHeight: 'var(--lh-relaxed)',
        }}>
          بتسجيل دخولك توافق على سياسة الخصوصية وشروط الاستخدام
        </p>
        <Footer />
      </section>
    </main>
  );
}