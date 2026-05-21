'use client';
/**
 * 📁 app/settings/security/page.tsx — ZAWAJ AI
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, AlertTriangle,
  Trash2, PowerOff, CheckCircle, ShieldCheck, Chrome,
  KeyRound, ShieldX,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import PageHeader  from '@/components/layout/PageHeader'; // هيدر المشروع الموجود
import BlockedUsersSheet from '@/components/security/BlockedUsersSheet';

// ══════════════════════════════════════════════════════════════
// أنواع
// ══════════════════════════════════════════════════════════════
type AlertType = 'success' | 'error' | 'warning';
type ModalType = 'disable' | 'delete' | null;
interface Alert { type: AlertType; msg: string; }

// ══════════════════════════════════════════════════════════════
// InlineAlert
// ══════════════════════════════════════════════════════════════
function InlineAlert({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const c = {
    success: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  text: '#22c55e' },
    error:   { bg: 'rgba(179,51,75,0.10)',  border: 'rgba(179,51,75,0.30)',  text: 'var(--color-primary)' },
    warning: { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)', text: '#eab308' },
  }[alert.type];
  const Icon = alert.type === 'success' ? CheckCircle : AlertTriangle;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)',
        padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--radius-sm)',
        background: c.bg, border: `1px solid ${c.border}`, color: c.text,
        fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)',
      }}
    >
      <Icon size={15} style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{ flex: 1, lineHeight: 'var(--lh-relaxed)' }}>{alert.msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, opacity: 0.6, fontSize: 14 }}>✕</button>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// حقل إدخال
// ══════════════════════════════════════════════════════════════
function Field({ label, type = 'text', value, onChange, placeholder, icon, endIcon }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ReactNode; endIcon?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const isLTR = type === 'email' || type === 'password';
  return (
    <div>
      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            direction: isLTR ? 'ltr' : 'rtl', width: '100%',
            padding: `var(--sp-3) ${endIcon ? '2.75rem' : 'var(--sp-4)'} var(--sp-3) ${icon ? '2.75rem' : 'var(--sp-4)'}`,
            borderRadius: 'var(--radius-sm)',
            background: focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${focused ? 'var(--color-primary)' : 'var(--glass-border)'}`,
            color: 'var(--text-main)', fontSize: 'var(--text-sm)',
            outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
        {icon && (
          <span style={{ position: 'absolute', left: 'var(--sp-3)', top: '50%', transform: 'translateY(-50%)', color: focused ? 'var(--color-primary)' : 'var(--text-tertiary)', display: 'flex', transition: 'color 0.2s', pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
        {endIcon && (
          <span style={{ position: 'absolute', left: 'var(--sp-3)', top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--text-tertiary)' }}>
            {endIcon}
          </span>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// قسم / بطاقة
// ══════════════════════════════════════════════════════════════
function Section({ icon, title, subtitle, children, accent = false }: {
  icon: React.ReactNode; title: string; subtitle: string;
  children: React.ReactNode; accent?: boolean;
}) {
  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-soft)',
      border: `1px solid ${accent ? 'rgba(179,51,75,0.2)' : 'var(--glass-border)'}`,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
        padding: 'var(--sp-4) var(--sp-4) var(--sp-3)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div style={{
          width: '2rem', height: '2rem', borderRadius: 'var(--radius-xs)',
          background: accent ? 'rgba(179,51,75,0.1)' : 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent ? 'var(--color-primary)' : 'var(--text-secondary)', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{title}</p>
          <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0', lineHeight: 1.4 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding: 'var(--sp-4)' }}>{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Bottom Sheet تأكيد
// ══════════════════════════════════════════════════════════════
function ConfirmSheet({ type, loading, onConfirm, onClose, deleteReason, setDeleteReason }: {
  type: ModalType; loading: boolean; onConfirm: () => void; onClose: () => void;
  deleteReason: string; setDeleteReason: (v: string) => void;
}) {
  if (!type) return null;
  const isDel = type === 'delete';
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => { if (!loading) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          padding: 'var(--sp-6)',
          paddingBottom: 'calc(var(--sp-8) + var(--safe-bottom, 0px))',
          border: '1px solid var(--glass-border)', borderBottom: 'none',
        }}
      >
        <div style={{ width: '2.5rem', height: '0.2rem', borderRadius: 99, background: 'var(--glass-border)', margin: '0 auto var(--sp-5)' }} />

        <div style={{
          width: '3.25rem', height: '3.25rem', borderRadius: 'var(--radius-sm)',
          background: isDel ? 'rgba(179,51,75,0.1)' : 'rgba(234,179,8,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--sp-4)', color: isDel ? 'var(--color-primary)' : '#eab308',
        }}>
          {isDel ? <Trash2 size={20} /> : <PowerOff size={20} />}
        </div>

        <h3 style={{ textAlign: 'center', fontSize: 'var(--text-lg)', fontWeight: 800, margin: '0 0 var(--sp-2)', color: 'var(--text-main)' }}>
          {isDel ? 'حذف الحساب نهائياً' : 'تعطيل الحساب مؤقتاً'}
        </h3>
        <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 'var(--lh-relaxed)', margin: '0 0 var(--sp-5)' }}>
          {isDel
            ? 'سيتم حذف جميع بياناتك وصورك ونقاطك نهائياً. هذا الإجراء لا يمكن التراجع عنه.'
            : 'سيُخفى ملفك ولن تتلقى أي إشعارات. يمكنك العودة في أي وقت بتسجيل الدخول.'}
        </p>

        {isDel && (
          <select
            value={deleteReason} onChange={e => setDeleteReason(e.target.value)}
            style={{
              width: '100%', padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
              color: deleteReason ? 'var(--text-main)' : 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)', fontFamily: 'inherit',
              outline: 'none', marginBottom: 'var(--sp-4)', direction: 'rtl',
            }}
          >
            <option value="">سبب الحذف (اختياري)</option>
            <option value="found_partner">✨ وجدت شريك الحياة</option>
            <option value="not_useful">التطبيق لم يناسبني</option>
            <option value="privacy">أسباب خصوصية</option>
            <option value="technical">مشاكل تقنية</option>
            <option value="other">أسباب أخرى</option>
          </select>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <button
            onClick={onConfirm} disabled={loading}
            className="btn-premium"
            style={{
              width: '100%', height: 'var(--btn-h-lg)',
              background: isDel ? 'var(--color-primary)' : 'rgba(234,179,8,0.12)',
              border: isDel ? 'none' : '1px solid rgba(234,179,8,0.35)',
              color: isDel ? '#fff' : '#eab308',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'جارٍ المعالجة...' : isDel ? 'نعم، احذف حسابي' : 'نعم، عطّل حسابي'}
          </button>
          <button
            onClick={onClose} disabled={loading}
            style={{
              width: '100%', height: 'var(--btn-h)', borderRadius: 'var(--radius-full)',
              background: 'transparent', border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)', fontSize: 'var(--text-sm)',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// مؤشر قوة كلمة المرور
// ══════════════════════════════════════════════════════════════
function StrengthBar({ pass }: { pass: string }) {
  if (!pass) return null;
  const score = [pass.length >= 8, pass.length >= 12, /[A-Z]/.test(pass) || /[0-9]/.test(pass), /[^A-Za-z0-9]/.test(pass)].filter(Boolean).length;
  const labels = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية ✓'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= score ? colors[score] : 'var(--glass-border)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <p style={{ fontSize: 'var(--text-2xs)', color: colors[score] || 'var(--text-tertiary)', margin: 0 }}>{labels[score]}</p>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ══════════════════════════════════════════════════════════════
export default function SecurityPage() {
  const router = useRouter();

  const [user,      setUser]      = useState<any>(null);
  const [isGoogle,  setIsGoogle]  = useState(false);
  const [pageLoad,  setPageLoad]  = useState(true);
  const [blockedOpen, setBlockedOpen] = useState(false);

  // إيميل
  const [newEmail,     setNewEmail]     = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailAlert,   setEmailAlert]   = useState<Alert | null>(null);

  // كلمة المرور
  const [passMode,    setPassMode]    = useState<'change' | 'forgot'>('change');
  const [currPass,    setCurrPass]    = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurr,    setShowCurr]    = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConf,    setShowConf]    = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passAlert,   setPassAlert]   = useState<Alert | null>(null);

  // تعطيل / حذف
  const [modal,         setModal]         = useState<ModalType>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteReason,  setDeleteReason]  = useState('');

  // ── جلب المستخدم ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.replace('/login'); return; }
      setUser(u);
      const isG = u.app_metadata?.provider === 'google' ||
        (u.identities ?? []).some((i: any) => i.provider === 'google');
      setIsGoogle(isG);
      setPageLoad(false);
    })();
  }, [router]);

  // ── تغيير الإيميل ─────────────────────────────────────────
  const handleEmailChange = useCallback(async () => {
    setEmailAlert(null);
    const t = newEmail.trim().toLowerCase();
    if (!t)                              { setEmailAlert({ type: 'error',   msg: 'أدخل البريد الإلكتروني الجديد' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) { setEmailAlert({ type: 'error', msg: 'البريد الإلكتروني غير صالح' }); return; }
    if (t === user?.email)               { setEmailAlert({ type: 'warning', msg: 'هذا هو بريدك الحالي بالفعل' }); return; }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: t });
    setEmailLoading(false);
    if (error) { setEmailAlert({ type: 'error', msg: 'فشل تغيير البريد. حاول مجدداً.' }); }
    else       { setEmailAlert({ type: 'success', msg: `أُرسل رابط التأكيد إلى ${t}` }); setNewEmail(''); }
  }, [newEmail, user]);

  // ── نسيت كلمة المرور (إرسال رابط reset) ──────────────────
  const handleForgotPassword = useCallback(async () => {
    setPassLoading(true); setPassAlert(null);
    const { error } = await supabase.auth.resetPasswordForEmail(user?.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPassLoading(false);
    if (error) { setPassAlert({ type: 'error', msg: 'فشل إرسال الرابط. حاول مجدداً.' }); }
    else       { setPassAlert({ type: 'success', msg: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني' }); }
  }, [user]);

  // ── تغيير كلمة المرور ─────────────────────────────────────
  const handlePasswordChange = useCallback(async () => {
    setPassAlert(null);
    if (!newPass)             { setPassAlert({ type: 'error', msg: 'أدخل كلمة المرور الجديدة' }); return; }
    if (newPass.length < 8)   { setPassAlert({ type: 'error', msg: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }); return; }
    if (newPass !== confirmPass) { setPassAlert({ type: 'error', msg: 'كلمتا المرور غير متطابقتين' }); return; }
    if (!isGoogle && !currPass)  { setPassAlert({ type: 'error', msg: 'أدخل كلمة مرورك الحالية' }); return; }
    setPassLoading(true);
    if (!isGoogle) {
      const { error: e } = await supabase.auth.signInWithPassword({ email: user.email, password: currPass });
      if (e) { setPassLoading(false); setPassAlert({ type: 'error', msg: 'كلمة المرور الحالية غير صحيحة' }); return; }
    }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPassLoading(false);
    if (error) { setPassAlert({ type: 'error', msg: 'فشل تغيير كلمة المرور. حاول مجدداً.' }); }
    else       { setPassAlert({ type: 'success', msg: 'تم تغيير كلمة مرورك بنجاح ✓' }); setCurrPass(''); setNewPass(''); setConfirmPass(''); }
  }, [currPass, newPass, confirmPass, isGoogle, user]);

  // ── تعطيل ─────────────────────────────────────────────────
  const handleDisable = useCallback(async () => {
    setActionLoading(true);
    const { data, error } = await supabase.rpc('disable_my_account');
    setActionLoading(false);
    if (error || !data?.success) { setModal(null); return; }
    await supabase.auth.signOut();
    router.replace('/login');
  }, [router]);

  // ── حذف ───────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
          body: JSON.stringify({ reason: deleteReason || null }),
        }
      );
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      await supabase.auth.signOut();
      router.replace('/');
    } catch { setActionLoading(false); setModal(null); }
  }, [deleteReason, router]);

  // ── Loading ────────────────────────────────────────────────
  if (pageLoad) return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
        style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid var(--color-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  // ══════════════════════════════════════════════════════════
  return (
    <>
      <main style={{ minHeight: '100dvh', background: 'var(--bg-main)', paddingBottom: 'calc(var(--nav-h-safe) + var(--sp-4))' }}>

        {/* هيدر المشروع */}
        <PageHeader title="الأمان والخصوصية" />

        <div style={{
          maxWidth: 480, margin: '0 auto',
          padding: 'var(--sp-4) var(--sp-4)',
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)',
          direction: 'rtl',
        }}>

          {/* شارة الإيميل الحالي */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
            padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--radius-sm)',
            background: 'rgba(179,51,75,0.06)', border: '1px solid rgba(179,51,75,0.15)',
          }}>
            {isGoogle ? <Chrome size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} /> : <Mail size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', direction: 'ltr', flex: 1 }}>{user?.email}</span>
            {isGoogle && (
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-primary)', fontWeight: 700, background: 'rgba(179,51,75,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>Google</span>
            )}
          </div>

          {/* ── 1. تغيير الإيميل ── */}
          <Section icon={<Mail size={15} />} title="تغيير البريد الإلكتروني" subtitle="سيصلك رابط تأكيد على البريد الجديد">
            <AnimatePresence>{emailAlert && <InlineAlert alert={emailAlert} onClose={() => setEmailAlert(null)} />}</AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <Field label="البريد الإلكتروني الجديد" type="email" value={newEmail} onChange={setNewEmail} placeholder="new@email.com" icon={<Mail size={14} />} />
              <button onClick={handleEmailChange} disabled={emailLoading || !newEmail.trim()} className="btn-premium"
                style={{ width: '100%', height: 'var(--btn-h)', fontSize: 'var(--text-sm)', opacity: (emailLoading || !newEmail.trim()) ? 0.5 : 1 }}>
                {emailLoading ? 'جارٍ الإرسال...' : 'إرسال رابط التأكيد'}
              </button>
            </div>
          </Section>

          {/* ── 2. كلمة المرور ── */}
          <Section
            icon={<Lock size={15} />}
            title={isGoogle ? 'تعيين كلمة مرور' : 'كلمة المرور'}
            subtitle={isGoogle ? 'أضف كلمة مرور لتسجيل الدخول بدون Google' : 'يجب أن تكون 8 أحرف على الأقل'}
          >
            <AnimatePresence>{passAlert && <InlineAlert alert={passAlert} onClose={() => setPassAlert(null)} />}</AnimatePresence>

            {/* تبديل الوضع — للمستخدمين غير-Google فقط */}
            {!isGoogle && (
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
                {([['change', 'تغيير كلمة المرور'], ['forgot', 'نسيت كلمة المرور']] as const).map(([mode, label]) => (
                  <button key={mode} onClick={() => { setPassMode(mode); setPassAlert(null); setCurrPass(''); setNewPass(''); setConfirmPass(''); }}
                    style={{
                      flex: 1, padding: 'var(--sp-2)', borderRadius: 'var(--radius-xs)',
                      background: passMode === mode ? 'var(--color-primary)' : 'transparent',
                      border: 'none', color: passMode === mode ? '#fff' : 'var(--text-tertiary)',
                      fontSize: 'var(--text-2xs)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* وضع: نسيت كلمة المرور */}
              {!isGoogle && passMode === 'forgot' ? (
                <motion.div key="forgot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)', marginBottom: 'var(--sp-4)', textAlign: 'right' }}>
                    سنُرسل لك رابطاً على بريدك الإلكتروني <strong style={{ color: 'var(--text-main)', direction: 'ltr', display: 'inline-block' }}>{user?.email}</strong> لإعادة تعيين كلمة مرورك.
                  </p>
                  <button onClick={handleForgotPassword} disabled={passLoading} className="btn-premium"
                    style={{ width: '100%', height: 'var(--btn-h)', fontSize: 'var(--text-sm)', opacity: passLoading ? 0.5 : 1, gap: 'var(--sp-2)' }}>
                    <KeyRound size={15} />
                    {passLoading ? 'جارٍ الإرسال...' : 'إرسال رابط إعادة التعيين'}
                  </button>
                </motion.div>
              ) : (
                /* وضع: تغيير كلمة المرور */
                <motion.div key="change" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {!isGoogle && (
                    <Field label="كلمة المرور الحالية" type={showCurr ? 'text' : 'password'} value={currPass} onChange={setCurrPass} placeholder="••••••••" icon={<Lock size={14} />}
                      endIcon={<button onClick={() => setShowCurr(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>{showCurr ? <EyeOff size={14} /> : <Eye size={14} />}</button>} />
                  )}
                  <Field label="كلمة المرور الجديدة" type={showNew ? 'text' : 'password'} value={newPass} onChange={setNewPass} placeholder="••••••••" icon={<Lock size={14} />}
                    endIcon={<button onClick={() => setShowNew(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>{showNew ? <EyeOff size={14} /> : <Eye size={14} />}</button>} />
                  <StrengthBar pass={newPass} />
                  <Field label="تأكيد كلمة المرور" type={showConf ? 'text' : 'password'} value={confirmPass} onChange={setConfirmPass} placeholder="••••••••" icon={<Lock size={14} />}
                    endIcon={<button onClick={() => setShowConf(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>{showConf ? <EyeOff size={14} /> : <Eye size={14} />}</button>} />
                  {/* مؤشر تطابق كلمة المرور */}
                  {confirmPass && newPass && (
                    <p style={{ fontSize: 'var(--text-2xs)', color: newPass === confirmPass ? '#22c55e' : '#ef4444', margin: 0 }}>
                      {newPass === confirmPass ? '✓ كلمتا المرور متطابقتان' : '✗ كلمتا المرور غير متطابقتين'}
                    </p>
                  )}
                  <button onClick={handlePasswordChange} disabled={passLoading || !newPass || !confirmPass} className="btn-premium"
                    style={{ width: '100%', height: 'var(--btn-h)', fontSize: 'var(--text-sm)', opacity: (passLoading || !newPass || !confirmPass) ? 0.5 : 1 }}>
                    {passLoading ? 'جارٍ الحفظ...' : isGoogle ? 'تعيين كلمة المرور' : 'تغيير كلمة المرور'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          {/* ── 3. المستخدمون المحظورون ── */}
          <button
            onClick={() => setBlockedOpen(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
              padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-soft)', border: '1px solid var(--glass-border)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-xs)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
              <ShieldX size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>المستخدمون المحظورون</p>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>إدارة قائمة الحظر</p>
            </div>
            <ShieldCheck size={14} style={{ color: 'var(--text-tertiary)' }} />
          </button>

          {/* ── 4. إدارة الحساب ── */}
          <Section icon={<AlertTriangle size={15} />} title="إدارة الحساب" subtitle="تعطيل الحساب أو حذفه نهائياً" accent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <button onClick={() => setModal('disable')} style={{
                width: '100%', height: 'var(--btn-h)', borderRadius: 'var(--radius-full)',
                background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.25)',
                color: '#eab308', fontSize: 'var(--text-sm)', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)',
              }}>
                <PowerOff size={14} /> تعطيل الحساب مؤقتاً
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <div style={{ height: 1, flex: 1, background: 'var(--glass-border)' }} />
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>أو</span>
                <div style={{ height: 1, flex: 1, background: 'var(--glass-border)' }} />
              </div>
              <button onClick={() => setModal('delete')} style={{
                width: '100%', height: 'var(--btn-h)', borderRadius: 'var(--radius-full)',
                background: 'rgba(179,51,75,0.06)', border: '1px solid rgba(179,51,75,0.25)',
                color: 'var(--color-primary)', fontSize: 'var(--text-sm)', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)',
              }}>
                <Trash2 size={14} /> حذف الحساب نهائياً
              </button>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0, opacity: 0.7, lineHeight: 'var(--lh-relaxed)' }}>
                الحذف النهائي يزيل جميع بياناتك ولا يمكن التراجع عنه
              </p>
            </div>
          </Section>

        </div>
      </main>

      {/* Bottom Sheet تأكيد */}
      <AnimatePresence>
        {modal && (
          <ConfirmSheet
            type={modal} loading={actionLoading}
            onConfirm={modal === 'delete' ? handleDelete : handleDisable}
            onClose={() => { if (!actionLoading) setModal(null); }}
            deleteReason={deleteReason} setDeleteReason={setDeleteReason}
          />
        )}
      </AnimatePresence>

      {/* قائمة المحظورين */}
      <BlockedUsersSheet open={blockedOpen} onClose={() => setBlockedOpen(false)} />
    </>
  );
}