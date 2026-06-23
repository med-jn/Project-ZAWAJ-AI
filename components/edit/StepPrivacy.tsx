'use client';
/**
 * StepPrivacy — الخطوة 3 لصفحة التعديل
 * تضبيب الصورة + رؤية صور الأعضاء فقط
 */
import { ShieldCheck, Eye, EyeOff, Camera } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';
import type { EditForm } from './types';

interface Props {
  form: EditForm;
  set:  <K extends keyof EditForm>(k: K, v: EditForm[K]) => void;
  avatarUrl?: string;
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
          position: 'relative', padding: 3, borderRadius: '50%',
          background: avatarUrl
            ? 'linear-gradient(135deg, var(--color-primary), #D4AF37)'
            : 'var(--glass-border)',
          boxShadow: avatarUrl ? '0 8px 32px var(--shadow-red-glow)' : 'none',
        }}>
          {avatarUrl ? (
            <img
              src={avatarUrl} alt="صورتك"
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

        {/* تضبيب صورتي */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--sp-4)',
          background: form.is_photos_blurred ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
          border: `1.5px solid ${form.is_photos_blurred ? 'var(--color-primary)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-lg)', transition: 'all 0.22s ease',
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
                تضبيب صورتك
              </p>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                {form.is_photos_blurred ? 'مفعّل — صورتك محمية من الغرباء' : 'اضغط لحماية خصوصيتك'}
              </p>
            </div>
          </div>
          <Toggle
            value={form.is_photos_blurred}
            onChange={v => set('is_photos_blurred', v)}
          />
        </div>

        {/* إظهار/إخفاء صور الأعضاء */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--sp-4)',
          background: !form.show_photos ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
          border: `1.5px solid ${!form.show_photos ? 'var(--color-primary)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-lg)', transition: 'all 0.22s ease',
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
                ? <Eye    size={20} style={{ color: 'var(--text-tertiary)' }} />
                : <EyeOff size={20} style={{ color: '#fff' }} />
              }
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {form.show_photos ? 'رؤية صور الأعضاء' : 'إخفاء صور الأعضاء'}
              </p>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                {form.show_photos ? 'الصور تظهر عادياً' : 'مفعّل — كل الصور مضبّبة'}
              </p>
            </div>
          </div>
          <Toggle
            value={!form.show_photos}
            onChange={v => set('show_photos', !v)}
          />
        </div>

      </div>

      {/* تلميح */}
      <div style={{
        marginTop: 'var(--sp-4)', padding: 'var(--sp-3) var(--sp-4)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
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