'use client';
/**
 * 📁 app/reports/page.tsx — ZAWAJ AI
 * مركز البلاغات: بلاغاتي (الحالة + التاريخ + الرقم المرجعي) + تنبيهات حسابي (تحذيرات وإجراءات الإشراف)
 * خصوصية: لا تُعرض هنا بلاغات الآخرين ضدك ولا هوية أي مُبلِّغ ولا ملاحظات المشرفين.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, Clock, Flag, MessageCircle, ShieldAlert, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import PageHeader from '@/components/layout/PageHeader';

const SUPPORT_EMAIL = 'support@orcaup.com';

type MyReport = {
  id: string;
  ref_no: number | null;
  reason: string | null;
  details: string | null;
  status: string | null;
  target_type: string | null;
  created_at: string;
  updated_at: string | null;
  attachments_count: number | null;
};

type Notice = {
  id: string;
  kind: 'warning' | 'hidden' | 'restored' | 'suspended' | 'reinstated';
  title: string;
  message: string;
  created_at: string;
};

const REASON_LABELS: Record<string, string> = {
  child_safety: 'استغلال أو إساءة تخص قاصرًا',
  underage: 'عمر غير حقيقي',
  fake_identity: 'انتحال أو معلومات غير حقيقية',
  inappropriate_photos: 'صور غير مناسبة',
  harassment: 'إزعاج أو سلوك غير محترم',
  sexual_content: 'محتوى غير لائق',
  scam: 'احتيال أو طلبات مالية',
  spam: 'رسائل مزعجة أو متكررة',
  married_not_serious: 'غير جاد في الزواج',
  offensive_language: 'ألفاظ أو تصرفات مسيئة',
  other: 'سبب آخر',
};

const TARGET_LABELS: Record<string, string> = {
  profile: 'ملف شخصي',
  message: 'رسالة',
  conversation: 'محادثة',
  image: 'صورة',
  voice: 'رسالة صوتية',
  call: 'مكالمة',
  story: 'قصة',
  other: 'أخرى',
};

// حالات البلاغ كما تُعرض لصاحبه (لا نكشف تفاصيل الإجراء ضد الطرف الآخر)
const STATUS: Record<string, { label: string; hint: string; color: string; icon: any }> = {
  pending:       { label: 'قيد الانتظار',       hint: 'استلمنا بلاغك وهو بانتظار المراجعة.',            color: '#eab308', icon: Clock },
  investigating: { label: 'قيد المراجعة',       hint: 'يراجع فريق الإشراف بلاغك الآن.',                color: '#38bdf8', icon: ShieldAlert },
  resolved:      { label: 'اكتملت المعالجة',     hint: 'اتخذنا الإجراء المناسب وفق سياسات التطبيق.',    color: '#22c55e', icon: Check },
  rejected:      { label: 'لم تتبيّن مخالفة',    hint: 'لم نجد مخالفة لسياسات التطبيق. يمكنك تقديم بلاغ جديد بأدلة إضافية.', color: '#9ca3af', icon: X },
};

const NOTICE_STYLE: Record<Notice['kind'], { color: string; label: string }> = {
  warning:    { color: '#eab308', label: 'تحذير' },
  hidden:     { color: '#fb923c', label: 'إخفاء الملف' },
  restored:   { color: '#22c55e', label: 'إعادة الظهور' },
  suspended:  { color: '#ef4444', label: 'إيقاف الحساب' },
  reinstated: { color: '#22c55e', label: 'إعادة التفعيل' },
};

const refLabel = (n: number | null, id: string) =>
  n ? `ZR-${String(n).padStart(6, '0')}` : `#${id.slice(0, 8).toUpperCase()}`;

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
};

export default function ReportsCenterPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'mine' | 'notices'>('mine');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<MyReport[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    const [r, n] = await Promise.all([
      supabase.rpc('my_reports'),
      supabase.from('account_notices')
        .select('id,kind,title,message,created_at')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (r.error) setError('تعذّر تحميل بلاغاتك. حاول لاحقًا.');
    setReports((r.data as MyReport[]) ?? []);
    setNotices((n.data as Notice[]) ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const tabBtn = (key: 'mine' | 'notices', label: string, count: number) => (
    <button
      onClick={() => setTab(key)}
      style={{
        flex: 1, padding: 'var(--sp-3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        border: `1px solid ${tab === key ? 'var(--color-primary)' : 'var(--glass-border)'}`,
        background: tab === key ? 'var(--color-primary-xsoft)' : 'transparent',
        color: tab === key ? 'var(--text-main)' : 'var(--text-tertiary)',
        fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      {label}
      {count > 0 && (
        <span style={{ minWidth: 20, height: 20, borderRadius: 99, padding: '0 6px', fontSize: 11, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--color-primary)', color: '#fff' }}>
          {count}
        </span>
      )}
    </button>
  );

  const card: React.CSSProperties = {
    borderRadius: 'var(--radius-md)', background: 'var(--bg-soft)',
    border: '1px solid var(--glass-border)', padding: 'var(--sp-4)',
  };

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-main)', paddingTop: 'var(--header-h-safe)', paddingBottom: 'calc(var(--nav-h-safe) + var(--sp-4))' }}>
      <PageHeader title="البلاغات والتنبيهات" fallbackRoute="/home" />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', direction: 'rtl' }}>

        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {tabBtn('mine', 'بلاغاتي', reports.length)}
          {tabBtn('notices', 'تنبيهات حسابي', notices.length)}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-8)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid var(--color-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : error ? (
          <div style={{ ...card, display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', color: '#f87171', fontSize: 'var(--text-sm)' }}>
            <AlertTriangle size={18} /> {error}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {tab === 'mine' ? (
              <motion.div key="mine" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {reports.length === 0 ? (
                  <div style={{ ...card, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--lh-relaxed)' }}>
                    <Flag size={28} style={{ margin: '0 auto var(--sp-2)', display: 'block', opacity: 0.6 }} />
                    لم ترسل أي بلاغ بعد.
                    <br />يمكنك الإبلاغ عن أي ملف أو محادثة من قائمة ⋮ داخلها.
                  </div>
                ) : reports.map((r) => {
                  const st = STATUS[r.status ?? 'pending'] ?? STATUS.pending;
                  const StIcon = st.icon;
                  return (
                    <div key={r.id} style={card}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 'var(--sp-2)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: 0.5, direction: 'ltr' }}>
                          {refLabel(r.ref_no, r.id)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99,
                          fontSize: 'var(--text-xs)', fontWeight: 700, color: st.color, background: `${st.color}1f` }}>
                          <StIcon size={13} /> {st.label}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)' }}>
                        {REASON_LABELS[r.reason ?? ''] ?? r.reason ?? '—'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        {TARGET_LABELS[r.target_type ?? 'profile'] ?? 'ملف شخصي'} · {fmtDate(r.created_at)}
                        {(r.attachments_count ?? 0) > 0 ? ` · ${r.attachments_count} لقطة شاشة` : ''}
                      </p>

                      {r.details && (
                        <p style={{ margin: 'var(--sp-3) 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)',
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {r.details}
                        </p>
                      )}

                      <p style={{ margin: 'var(--sp-3) 0 0', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--glass-border)',
                        fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 'var(--lh-relaxed)' }}>
                        {st.hint}
                        {r.updated_at && r.updated_at !== r.created_at ? ` (آخر تحديث: ${fmtDate(r.updated_at)})` : ''}
                      </p>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="notices" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {notices.length === 0 ? (
                  <div style={{ ...card, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--lh-relaxed)' }}>
                    <Check size={28} style={{ margin: '0 auto var(--sp-2)', display: 'block', color: '#22c55e' }} />
                    لا توجد تحذيرات أو إجراءات على حسابك. حسابك بحالة جيدة.
                  </div>
                ) : notices.map((n) => {
                  const ns = NOTICE_STYLE[n.kind] ?? NOTICE_STYLE.warning;
                  return (
                    <div key={n.id} style={{ ...card, borderColor: `${ns.color}55` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 'var(--sp-2)' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 'var(--text-xs)', fontWeight: 700, color: ns.color, background: `${ns.color}1f` }}>
                          {ns.label}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{fmtDate(n.created_at)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)' }}>{n.title}</p>
                      <p style={{ margin: 'var(--sp-2) 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>
                        {n.message}
                      </p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* التواصل والملاحظات */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <button
            onClick={() => router.push('/feedback/')}
            className="btn-premium"
            style={{ height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <MessageCircle size={18} /> إرسال ملاحظات أو شكوى
          </button>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 'var(--lh-relaxed)', textAlign: 'center' }}>
            للاعتراض على أي إجراء أو لأي استفسار، راسلنا على{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--color-primary)', fontWeight: 700, direction: 'ltr', display: 'inline-block' }}>
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
