'use client';
/**
 * StepPrivacy — الخطوة 3 لصفحة التعديل
 * تضبيب الصورة + رؤية صور الأعضاء فقط
 * تغيير الصورة يتم من صفحة الملف الشخصي
 */
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Eye, EyeOff, Check, Camera } from 'lucide-react';
import type { EditForm } from './types';

interface Props {
  form: EditForm;
  set:  <K extends keyof EditForm>(k: K, v: EditForm[K]) => void;
  avatarUrl?: string;
}

function Toggle({
  enabled, onToggle, icon, title, subtitle, activeSubtitle,
}: {
  enabled: boolean; onToggle: () => void;
  icon: React.ReactNode; title: string;
  subtitle: string; activeSubtitle: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      style={{
        width: '100%',
        background: enabled ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: `1.5px solid ${enabled ? 'var(--color-primary)' : 'var(--glass-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--sp-4)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', transition: 'all 0.22s',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: enabled ? '0 4px 16px var(--shadow-red-glow)' : 'none',
        direction: 'rtl', marginBottom: 'var(--sp-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: enabled ? 'var(--color-primary)' : 'var(--bg-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: enabled ? '0 4px 12px var(--shadow-red-glow)' : 'none',
        }}>
          <span style={{ color: enabled ? '#fff' : 'var(--text-tertiary)', display: 'flex' }}>
            {icon}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0,
            color: enabled ? 'var(--text-main)' : 'var(--text-secondary)',
          }}>{title}</p>
          <p style={{
            fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0',
          }}>{enabled ? activeSubtitle : subtitle}</p>
        </div>
      </div>

      {/* Toggle pill */}
      <div style={{
        width: 44, height: 24, borderRadius: 99, flexShrink: 0,
        background: enabled ? 'var(--color-primary)' : 'var(--bg-elevated)',
        border: '1.5px solid var(--border-soft)',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <motion.div
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            position: 'absolute', top: 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </motion.button>
  );
}

export default function StepPrivacy({ form, set, avatarUrl }: Props) {
  return (
    <div dir="rtl">

      {/* ── معاينة الصورة الحالية ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', marginBottom: 'var(--sp-6)',
      }}>
        <div style={{
          position: 'relative',
          padding: 3, borderRadius: '50%',
          background: avatarUrl
            ? 'linear-gradient(135deg, var(--color-primary), #D4AF37)'
            : 'var(--glass-border)',
          boxShadow: avatarUrl ? '0 8px 32px var(--shadow-red-glow)' : 'none',
        }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="صورتك"
              style={{
                width: 100, height: 100, borderRadius: '50%',
                objectFit: 'cover', display: 'block',
                filter: form.is_photos_blurred ? 'blur(8px)' : 'none',
                transition: 'filter 0.3s',
              }}
            />
          ) : (
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'var(--bg-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={32} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
            </div>
          )}
        </div>
        <p style={{
          fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
          marginTop: 'var(--sp-2)', textAlign: 'center', opacity: 0.6,
        }}>
          لتغيير الصورة اذهب إلى الملف الشخصي
        </p>
      </div>

      {/* ── إعدادات الخصوصية ── */}
      <Toggle
        enabled={form.is_photos_blurred}
        onToggle={() => set('is_photos_blurred', !form.is_photos_blurred)}
        icon={<ShieldCheck size={20} />}
        title="تضبيب صورتك"
        subtitle="اضغط لحماية خصوصيتك"
        activeSubtitle="مفعّل — صورتك محمية من الغرباء"
      />

      <Toggle
        enabled={!form.show_photos}
        onToggle={() => set('show_photos', !form.show_photos)}
        icon={form.show_photos ? <Eye size={20} /> : <EyeOff size={20} />}
        title={form.show_photos ? 'رؤية صور الأعضاء' : 'إخفاء صور الأعضاء'}
        subtitle="الصور تظهر عادياً"
        activeSubtitle="مفعّل — كل الصور مضبّبة"
      />

      {/* تلميح */}
      <div style={{
        marginTop: 'var(--sp-4)',
        padding: 'var(--sp-3) var(--sp-4)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        direction: 'rtl',
      }}>
        <p style={{
          fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
          lineHeight: 'var(--lh-relaxed)', margin: 0,
        }}>
          💡 تضبيب صورتك يحمي هويتك — تستطيع إلغاء الضباب في أي وقت لمن تختاره.
        </p>
      </div>
    </div>
  );
}