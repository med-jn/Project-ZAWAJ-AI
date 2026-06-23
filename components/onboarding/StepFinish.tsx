'use client';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ShieldCheck, Eye, EyeOff, Check, ExternalLink } from 'lucide-react';

import { Toggle } from '@/components/ui/Toggle';
import type { FD } from './types';

interface AgreementState {
  terms: boolean;
  privacy: boolean;
  honesty: boolean;
}

interface Props {
  form: FD;
  errs: Partial<Record<keyof FD, string>>;
  set: <K extends keyof FD>(k: K, v: FD[K]) => void;
  imgPreview: string;
  agreements: AgreementState;
  onAgreementChange: (key: keyof AgreementState, val: boolean) => void;
  onFileSelect: (file: File) => void;
  agreementsError?: string;
}

/* ── بطاقة موافقة ───────────────────────────── */
function AgreementCard({
  checked, onChange, icon, title, subtitle, linkLabel, linkHref, hasError,
}: {
  checked: boolean; onChange: (v: boolean) => void;
  icon: React.ReactNode; title: string; subtitle: string;
  linkLabel?: string; linkHref?: string; hasError?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      onClick={() => onChange(!checked)}
      style={{
        width: '100%',
        background: checked ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: `1.5px solid ${
          checked ? 'var(--color-primary)'
          : hasError ? 'var(--color-accent)'
          : 'var(--glass-border)'
        }`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--sp-4)',
        display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
        cursor: 'pointer', transition: 'all 0.22s ease',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: checked ? '0 4px 20px var(--shadow-red-glow)' : 'none',
        textAlign: 'right', direction: 'rtl',
      }}
    >
      {/* Checkbox */}
      <motion.div
        animate={{
          background: checked ? 'var(--color-primary)' : 'transparent',
          borderColor: checked ? 'var(--color-primary)' : 'var(--border-medium)',
          scale: checked ? 1.05 : 1,
        }}
        transition={{ duration: 0.18 }}
        style={{
          width: 24, height: 24, borderRadius: 8, flexShrink: 0,
          border: '2px solid var(--border-medium)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15, type: 'spring', stiffness: 500 }}
            >
              <Check size={14} color="#fff" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* النص */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0,
          color: checked ? 'var(--text-main)' : 'var(--text-secondary)',
          transition: 'color 0.2s',
        }}>{title}</p>
        <p style={{
          fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)',
          margin: '3px 0 0', lineHeight: 'var(--lh-relaxed)',
        }}>{subtitle}</p>
        {linkLabel && linkHref && (
          <a
            href={linkHref}
            onClick={e => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 'var(--text-2xs)', color: 'var(--color-primary)',
              fontWeight: 700, marginTop: 4, textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {linkLabel} <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* أيقونة */}
      <div style={{
        width: 38, height: 38, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: checked ? 'var(--color-primary)' : 'var(--bg-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        boxShadow: checked ? '0 4px 12px var(--shadow-red-glow)' : 'none',
      }}>
        <span style={{ color: checked ? '#fff' : 'var(--text-tertiary)', display: 'flex' }}>
          {icon}
        </span>
      </div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════
   المكوّن الرئيسي
══════════════════════════════════════════ */
export default function StepFinish({
  form, errs, set,
  imgPreview, agreements, onAgreementChange,
  onFileSelect, agreementsError,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allAgreed = agreements.terms && agreements.privacy && agreements.honesty;

  return (
    <div dir="rtl">

      {/* ══ رفع الصورة ══════════════════════════ */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
          e.target.value = '';
        }}
      />

      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 'var(--sp-8) var(--sp-4)',
          borderRadius: 'var(--radius-xl)',
          background: imgPreview ? 'var(--color-primary-xsoft)' : 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: `1.5px solid ${
            errs.avatar_url ? 'var(--color-accent)'
            : imgPreview    ? 'var(--color-primary)'
            : 'var(--glass-border)'
          }`,
          boxShadow: imgPreview
            ? '0 0 40px var(--shadow-red-glow), inset 0 1px 0 rgba(255,255,255,0.08)'
            : 'var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,0.05)',
          transition: 'all 0.3s ease',
          overflow: 'hidden', cursor: 'pointer',
          marginBottom: 'var(--sp-2)',
        }}
      >
        {!imgPreview && (
          <div style={{
            position: 'absolute', top: '-50%', left: '50%',
            transform: 'translateX(-50%)',
            width: '60%', height: '100%',
            background: 'radial-gradient(ellipse, rgba(179,51,75,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        )}

        {imgPreview ? (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              padding: 3, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), #D4AF37)',
              boxShadow: '0 8px 32px var(--shadow-red-glow), 0 0 0 1px rgba(212,175,55,0.3)',
            }}>
              <img src={imgPreview} alt="صورتك" style={{
                width: 140, height: 140, borderRadius: '50%',
                objectFit: 'cover', display: 'block',
              }} />
            </div>
            <div style={{
              position: 'absolute', bottom: 4, right: 4,
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px var(--shadow-red-glow)',
              border: '2px solid var(--bg-main)',
            }}>
              <Camera size={15} color="#fff" />
            </div>
            <p style={{
              textAlign: 'center', marginTop: 'var(--sp-3)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: 'var(--color-primary)',
            }}>اضغط لتغيير الصورة</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              margin: '0 auto var(--sp-4)',
              background: 'var(--color-primary-soft)',
              border: '1.5px solid var(--color-primary-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px var(--shadow-red-glow)',
            }}>
              <Camera size={32} style={{ color: 'var(--color-primary)' }} />
            </div>
            <p style={{
              fontSize: 'var(--text-lg)', fontWeight: 700,
              color: 'var(--text-main)', marginBottom: 'var(--sp-1)',
            }}>أضف صورتك</p>
            <p style={{
              fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
              lineHeight: 'var(--lh-relaxed)',
            }}>JPG · PNG · WEBP · حتى 5MB</p>
          </div>
        )}
      </motion.div>

      {errs.avatar_url && (
        <p style={{
          color: 'var(--error-text)', fontSize: 'var(--text-xs)',
          marginBottom: 'var(--sp-4)',
        }}>{errs.avatar_url}</p>
      )}

      {/* ══ معايير الصورة ══════════════════════ */}
      <div style={{
        borderRadius: 'var(--radius-lg)', marginBottom: 'var(--sp-5)',
        padding: 'var(--sp-4)', background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
      }}>
        <p style={{
          fontSize: 'var(--text-2xs)', fontWeight: 800,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--color-primary)', marginBottom: 'var(--sp-2)', opacity: 0.8,
        }}>معايير الصورة</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          {['وجه واضح وإضاءة جيدة', 'بدون نظارة شمسية أو فلتر', 'لباس محتشم'].map(txt => (
            <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: 'var(--color-primary)',
              }} />
              <p style={{
                fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
                lineHeight: 'var(--lh-normal)', margin: 0,
              }}>{txt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ خصوصية الصورة — Toggle الموحّد ════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>

        {/* تضبيب صورتي */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--sp-4)',
          background: form.is_photos_blurred ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
          border: `1.5px solid ${form.is_photos_blurred ? 'var(--color-primary)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-lg)',
          transition: 'all 0.22s ease',
          boxShadow: form.is_photos_blurred ? '0 4px 16px var(--shadow-red-glow)' : 'none',
          direction: 'rtl',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: form.is_photos_blurred ? 'var(--color-primary)' : 'var(--bg-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: form.is_photos_blurred ? '0 4px 12px var(--shadow-red-glow)' : 'none',
            }}>
              <ShieldCheck size={20} style={{ color: form.is_photos_blurred ? '#fff' : 'var(--text-tertiary)' }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                تضبيب الصورة
              </p>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                {form.is_photos_blurred ? 'مفعّل — صورتك محمية' : 'اضغط لحماية خصوصيتك'}
              </p>
            </div>
          </div>
          <Toggle
            value={form.is_photos_blurred}
            onChange={v => set('is_photos_blurred', v)}
          />
        </div>

        {/* إظهار صور الأعضاء */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--sp-4)',
          background: !form.show_photos ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
          border: `1.5px solid ${!form.show_photos ? 'var(--color-primary)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-lg)',
          transition: 'all 0.22s ease',
          boxShadow: !form.show_photos ? '0 4px 16px var(--shadow-red-glow)' : 'none',
          direction: 'rtl',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: !form.show_photos ? 'var(--color-primary)' : 'var(--bg-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: !form.show_photos ? '0 4px 12px var(--shadow-red-glow)' : 'none',
            }}>
              {form.show_photos
                ? <Eye     size={20} style={{ color: 'var(--text-tertiary)' }} />
                : <EyeOff  size={20} style={{ color: '#fff' }} />
              }
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {form.show_photos ? 'رؤية صور الأعضاء' : 'إخفاء صور الأعضاء'}
              </p>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                {form.show_photos ? 'ستظهر الصور عادياً' : 'مفعّل — ستُضبَّب كل الصور'}
              </p>
            </div>
          </div>
          <Toggle
            value={!form.show_photos}
            onChange={v => set('show_photos', !v)}
          />
        </div>

      </div>

      {/* ══ الموافقات الثلاث ════════════════════ */}
      <div style={{ marginBottom: 'var(--sp-2)' }}>
        <p style={{
          fontSize: 'var(--text-2xs)', fontWeight: 800, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--color-primary)',
          opacity: 0.8, marginBottom: 'var(--sp-3)',
        }}>أوافق على ما يلي</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <AgreementCard
            checked={agreements.terms}
            onChange={v => onAgreementChange('terms', v)}
            hasError={!!agreementsError && !agreements.terms}
            icon={<Check size={18} />}
            title="شروط الاستخدام"
            subtitle="قرأت وأوافق على شروط وأحكام منصة زواج AI"
            linkLabel="قراءة الشروط"
            linkHref="/terms"
          />
          <AgreementCard
            checked={agreements.privacy}
            onChange={v => onAgreementChange('privacy', v)}
            hasError={!!agreementsError && !agreements.privacy}
            icon={<ShieldCheck size={18} />}
            title="سياسة الخصوصية"
            subtitle="أوافق على جمع البيانات واستخدامها وفق سياسة الخصوصية"
            linkLabel="قراءة السياسة"
            linkHref="/privacy"
          />
          <AgreementCard
            checked={agreements.honesty}
            onChange={v => onAgreementChange('honesty', v)}
            hasError={!!agreementsError && !agreements.honesty}
            icon={<ShieldCheck size={18} />}
            title="تعهد الصدق والجدية"
            subtitle="أتعهد بصدق المعلومات المقدمة وجدية النية وتحمّل المسؤولية الأخلاقية"
          />
        </div>

        {agreementsError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              color: 'var(--error-text)', fontSize: 'var(--text-xs)',
              marginTop: 'var(--sp-3)', textAlign: 'center',
            }}
          >{agreementsError}</motion.p>
        )}

        {/* شريط تقدم الموافقات */}
        <div style={{ display: 'flex', gap: 6, marginTop: 'var(--sp-4)', alignItems: 'center' }}>
          {(['terms', 'privacy', 'honesty'] as const).map(k => (
            <motion.div
              key={k}
              animate={{
                background: agreements[k] ? 'var(--color-primary)' : 'var(--border-soft)',
                opacity: agreements[k] ? 1 : 0.35,
              }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1, height: 3, borderRadius: 99 }}
            />
          ))}
          <motion.span
            animate={{ opacity: allAgreed ? 1 : 0.4 }}
            style={{
              fontSize: 'var(--text-2xs)',
              color: allAgreed ? 'var(--color-primary)' : 'var(--text-tertiary)',
              fontWeight: 700, whiteSpace: 'nowrap', marginRight: 4,
            }}
          >
            {[agreements.terms, agreements.privacy, agreements.honesty].filter(Boolean).length}/3
          </motion.span>
        </div>
      </div>

    </div>
  );
}