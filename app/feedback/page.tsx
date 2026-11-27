'use client';
/**
 * 📁 app/feedback/page.tsx — ZAWAJ AI
 * آلية ملاحظات داخل التطبيق (بلا مغادرته): اقتراح / مشكلة تقنية / سلامة وأمان / أخرى
 * In-app feedback mechanism — send suggestions, report problems or safety concerns without leaving the app.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2, MessageCircle, Send, ShieldAlert } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import PageHeader from '@/components/layout/PageHeader';

const SUPPORT_EMAIL = 'support@orcaup.com';
const MAX = 2000;
const MIN = 5;

const CATEGORIES: { value: string; label: string; sub: string }[] = [
  { value: 'suggestion', label: 'اقتراح',         sub: 'Suggestion' },
  { value: 'problem',    label: 'مشكلة تقنية',    sub: 'Technical problem' },
  { value: 'safety',     label: 'سلامة وأمان',    sub: 'Safety concern' },
  { value: 'other',      label: 'أخرى',           sub: 'Other' },
];

export default function FeedbackPage() {
  const router = useRouter();
  const [category, setCategory] = useState('suggestion');
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const canSend = message.trim().length >= MIN && !loading;

  async function appVersion(): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) return (await App.getInfo()).version;
    } catch { /* اختياري */ }
    return null;
  }

  async function handleSend() {
    if (!canSend) return;
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); router.replace('/login'); return; }

    const { error: insertError } = await supabase.from('user_feedback').insert({
      user_id: user.id,
      category,
      message: message.trim(),
      app_version: await appVersion(),
    });

    setLoading(false);
    if (insertError) {
      const msg = String(insertError.message).includes('feedback_rate_limit')
        ? 'وصلت إلى الحد اليومي للملاحظات (5). حاول غدًا.'
        : 'تعذّر إرسال ملاحظتك، حاول مرة أخرى.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setSent(true);
  }

  const card: React.CSSProperties = {
    borderRadius: 'var(--radius-md)', background: 'var(--bg-soft)',
    border: '1px solid var(--glass-border)', padding: 'var(--sp-4)',
  };

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-main)', paddingTop: 'var(--header-h-safe)', paddingBottom: 'calc(var(--nav-h-safe) + var(--sp-4))' }}>
      <PageHeader title="ملاحظات وشكاوى" fallbackRoute="/home" />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', direction: 'rtl' }}>
        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            style={{ ...card, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-6)' }}>
            <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={30} />
            </div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-main)' }}>شكرًا لك، وصلتنا ملاحظتك</h3>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>
              يراجع فريقنا الملاحظات بشكل دوري. للأمور العاجلة المتعلقة بالسلامة، راسلنا على {SUPPORT_EMAIL}.
            </p>
            <button onClick={() => router.push('/reports/')} className="btn-premium" style={{ height: '3rem', width: '100%' }}>
              بلاغاتي وتنبيهاتي
            </button>
            <button onClick={() => { setSent(false); setMessage(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--text-sm)' }}>
              إرسال ملاحظة أخرى
            </button>
          </motion.div>
        ) : (
          <>
            <div style={{ ...card, display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--color-primary-xsoft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageCircle size={18} />
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>
                شاركنا رأيك أو أبلغنا عن مشكلة دون مغادرة التطبيق. للإبلاغ عن مستخدم محدد استخدم زر «إبلاغ» في قائمة ⋮ داخل ملفه أو محادثته.
              </p>
            </div>

            <div>
              <p style={{ margin: '0 0 var(--sp-2)', fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-main)' }}>نوع الملاحظة</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                {CATEGORIES.map((c) => {
                  const on = category === c.value;
                  return (
                    <button key={c.value} onClick={() => setCategory(c.value)}
                      style={{
                        padding: 'var(--sp-3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'right',
                        border: `1px solid ${on ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                        background: on ? 'var(--color-primary-xsoft)' : 'transparent',
                        fontFamily: 'inherit',
                      }}>
                      <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-main)' }}>{c.label}</span>
                      <span style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', direction: 'ltr', textAlign: 'right' }}>{c.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {category === 'safety' && (
              <div style={{ ...card, display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start', borderColor: 'rgba(239,68,68,0.35)' }}>
                <ShieldAlert size={18} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>
                  لا تُرفق أو تنقل أي صور أو مقاطع تخص قاصرًا. صف الحالة نصيًا وسنتعامل معها بأولوية.
                </p>
              </div>
            )}

            <div>
              <p style={{ margin: '0 0 var(--sp-2)', fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-main)' }}>رسالتك</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
                placeholder="اكتب ملاحظتك هنا..."
                style={{
                  width: '100%', minHeight: '9rem', resize: 'none', borderRadius: 'var(--radius-lg)',
                  padding: 'var(--sp-4)', background: 'var(--glass-bg)', border: '1px solid var(--border-soft)',
                  color: 'var(--text-main)', fontSize: 'var(--text-base)', outline: 'none',
                  lineHeight: 'var(--lh-relaxed)', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                <span>{message.trim().length > 0 && message.trim().length < MIN ? `اكتب ${MIN} أحرف على الأقل` : ''}</span>
                <span>{message.length}/{MAX}</span>
              </div>
            </div>

            {error && (
              <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 700, color: '#f87171' }}>{error}</p>
            )}

            <button onClick={handleSend} disabled={!canSend} className="btn-premium"
              style={{ height: '3.2rem', opacity: canSend ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><Loader2 className="animate-spin" size={18} /> جاري الإرسال...</> : <><Send size={18} /> إرسال</>}
            </button>

            <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              أو راسلنا على{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--color-primary)', fontWeight: 700, direction: 'ltr', display: 'inline-block' }}>{SUPPORT_EMAIL}</a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
