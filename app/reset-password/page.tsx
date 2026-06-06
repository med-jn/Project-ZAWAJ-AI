'use client';
/**
 * 📁 app/reset-password/page.tsx — ZAWAJ AI
 * تستقبل رابط إعادة تعيين كلمة المرور من الإيميل
 * وتسمح للمستخدم بتعيين كلمة مرور جديدة داخل التطبيق
 */

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// ══════════════════════════════════════════════════════════════
// مؤشر قوة كلمة المرور
// ══════════════════════════════════════════════════════════════
function StrengthBar({ pass }: { pass: string }) {
  if (!pass) return null;
  const score = [
    pass.length >= 8,
    pass.length >= 12,
    /[A-Z]/.test(pass) || /[0-9]/.test(pass),
    /[^A-Za-z0-9]/.test(pass),
  ].filter(Boolean).length;
  const labels = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية ✓'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= score ? colors[score] : 'var(--glass-border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 'var(--text-2xs)', color: colors[score] || 'var(--text-tertiary)', margin: 0 }}>
        {labels[score]}
      </p>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ══════════════════════════════════════════════════════════════
export default function ResetPasswordPage() {
  const router = useRouter();

  type Stage = 'loading' | 'form' | 'success' | 'invalid';
  const [stage,       setStage]       = useState<Stage>('loading');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showConf,    setShowConf]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  // ── استقبال الجلسة ─────────────────────────────────────────
  useEffect(() => {
    // أولاً: تحقق إن كانت الجلسة موجودة مسبقاً (مرّت عبر /auth/callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setStage('form'); return; }

      // ثانياً: استمع لحدث PASSWORD_RECOVERY الذي يُطلقه Supabase
      // عند فتح الرابط مباشرة بدون callback
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === 'PASSWORD_RECOVERY' && session) {
            setStage('form');
          } else if (event === 'SIGNED_IN' && session) {
            setStage('form');
          }
        }
      );

      // ثالثاً: timeout — إذا لم تأت جلسة بعد 4 ثوانٍ فالرابط منتهٍ
      const timeout = setTimeout(() => {
        setStage(prev => prev === 'loading' ? 'invalid' : prev);
      }, 4000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    });
  }, []);

  // ── حفظ كلمة المرور الجديدة ───────────────────────────────
  const handleSave = async () => {
    setError('');
    if (!newPass)                { setError('أدخل كلمة المرور الجديدة'); return; }
    if (newPass.length < 8)      { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    if (newPass !== confirmPass)  { setError('كلمتا المرور غير متطابقتين'); return; }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
    setSaving(false);

    if (updateError) {
      setError('فشل تعيين كلمة المرور. الرابط قد يكون منتهي الصلاحية.');
      return;
    }
    setStage('success');
    setTimeout(() => router.replace('/home'), 2000);
  };

  // ══════════════════════════════════════════════════════════
  // واجهة Loading
  // ══════════════════════════════════════════════════════════
  if (stage === 'loading') return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)', gap: 20,
      fontFamily: 'Cairo, sans-serif',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid var(--color-accent)', borderTopColor: 'transparent' }}
      />
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
        جارٍ التحقق...
      </p>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // واجهة رابط منتهي أو خاطئ
  // ══════════════════════════════════════════════════════════
  if (stage === 'invalid') return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)', padding: 'var(--sp-8)',
      fontFamily: 'Cairo, sans-serif', direction: 'rtl',
    }}>
      <div style={{
        width: '4rem', height: '4rem', borderRadius: 'var(--radius-sm)',
        background: 'rgba(179,51,75,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-primary)', marginBottom: 'var(--sp-5)',
      }}>
        <AlertTriangle size={28} />
      </div>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 var(--sp-3)', textAlign: 'center' }}>
        الرابط غير صالح
      </h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 'var(--lh-relaxed)', margin: '0 0 var(--sp-6)' }}>
        هذا الرابط منتهي الصلاحية أو تم استخدامه مسبقاً.
        يرجى طلب رابط جديد من إعدادات الأمان.
      </p>
      <button
        onClick={() => router.replace('/security')}
        className="btn-premium"
        style={{ height: 'var(--btn-h)', paddingInline: 'var(--sp-8)', fontSize: 'var(--text-sm)' }}
      >
        العودة لإعدادات الأمان
      </button>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // واجهة النجاح
  // ══════════════════════════════════════════════════════════
  if (stage === 'success') return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)', padding: 'var(--sp-8)',
      fontFamily: 'Cairo, sans-serif', direction: 'rtl',
    }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          width: '4.5rem', height: '4.5rem', borderRadius: 'var(--radius-sm)',
          background: 'rgba(34,197,94,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#22c55e', marginBottom: 'var(--sp-5)',
        }}
      >
        <CheckCircle size={30} />
      </motion.div>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 var(--sp-3)', textAlign: 'center' }}>
        تم تعيين كلمة المرور
      </h2>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
        جارٍ تحويلك...
      </p>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // النموذج الرئيسي
  // ══════════════════════════════════════════════════════════
  return (
    <main style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 'var(--sp-6)',
      background: 'var(--bg-main)', fontFamily: 'Cairo, sans-serif',
    }} className="bg-luxury-gradient">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: 400, padding: 'var(--sp-8)', direction: 'rtl' }}
      >
        <div style={{
          width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-sm)',
          background: 'rgba(179,51,75,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-primary)', margin: '0 auto var(--sp-5)',
        }}>
          <KeyRound size={22} />
        </div>

        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, textAlign: 'center', color: 'var(--text-main)', margin: '0 0 var(--sp-2)' }}>
          كلمة مرور جديدة
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 'var(--lh-relaxed)', margin: '0 0 var(--sp-6)' }}>
          اختر كلمة مرور قوية لحماية حسابك
        </p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--radius-sm)',
                background: 'rgba(179,51,75,0.08)', border: '1px solid rgba(179,51,75,0.25)',
                color: 'var(--color-primary)', fontSize: 'var(--text-sm)',
                marginBottom: 'var(--sp-4)',
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
              كلمة المرور الجديدة
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="••••••••"
                style={{
                  direction: 'ltr', width: '100%',
                  padding: 'var(--sp-3) 2.75rem var(--sp-3) 2.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-main)', fontSize: 'var(--text-sm)',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e  => e.target.style.borderColor = 'var(--glass-border)'}
              />
              <Lock size={14} style={{ position: 'absolute', left: 'var(--sp-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <button onClick={() => setShowNew(p => !p)} style={{ position: 'absolute', right: 'var(--sp-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <StrengthBar pass={newPass} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
              تأكيد كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConf ? 'text' : 'password'}
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="••••••••"
                style={{
                  direction: 'ltr', width: '100%',
                  padding: 'var(--sp-3) 2.75rem var(--sp-3) 2.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-main)', fontSize: 'var(--text-sm)',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e  => e.target.style.borderColor = 'var(--glass-border)'}
              />
              <Lock size={14} style={{ position: 'absolute', left: 'var(--sp-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <button onClick={() => setShowConf(p => !p)} style={{ position: 'absolute', right: 'var(--sp-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>
                {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {confirmPass && newPass && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontSize: 'var(--text-2xs)', color: newPass === confirmPass ? '#22c55e' : '#ef4444', margin: '6px 0 0' }}
              >
                {newPass === confirmPass ? '✓ كلمتا المرور متطابقتان' : '✗ كلمتا المرور غير متطابقتين'}
              </motion.p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !newPass || !confirmPass}
            className="btn-premium"
            style={{
              width: '100%', height: 'var(--btn-h-lg)',
              fontSize: 'var(--text-base)', marginTop: 'var(--sp-2)',
              opacity: (saving || !newPass || !confirmPass) ? 0.5 : 1,
            }}
          >
            {saving ? 'جارٍ الحفظ...' : 'تعيين كلمة المرور الجديدة'}
          </button>
        </div>
      </motion.div>
    </main>
  );
}