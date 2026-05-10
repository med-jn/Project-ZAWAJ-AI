'use client';
/**
 * 📁 app/settings/page.tsx
 * الإعدادات: خصوصية + مظهر (3 أوضاع + شريط حجم) + إشعارات
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Eye, Save, Sun, Moon, Type, Monitor, Minus, Plus,
} from 'lucide-react';
import { supabase }        from '@/lib/supabase/client';
import { useTheme, ThemeMode } from '@/hooks/useTheme';
import { useSystemScale }  from '@/hooks/useSystemScale';

export default function SettingsPage() {
  // ── إعدادات الخصوصية ──────────────────────────
  const [notifEnabled,   setNotifEnabled]   = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [photosBlurred,  setPhotosBlurred]  = useState(false);

  // ── الثيم ─────────────────────────────────────
  const { mode, setTheme } = useTheme();

  // ── مقياس الخط والأيقونات ────────────────────
  const { scale, setScale, resetScale, MIN_SCALE, MAX_SCALE, DEFAULT_SCALE } = useSystemScale();

  // ── حالة الحفظ ────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // ── قراءة إعدادات Supabase ────────────────────
  useEffect(() => {
    const loadDB = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_photos_blurred')
        .eq('id', user.id)
        .single();
      if (data) setPhotosBlurred(data.is_photos_blurred ?? false);
    };
    loadDB();
  }, []);

  // ── حفظ إعدادات Supabase ─────────────────────
  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ is_photos_blurred: photosBlurred })
        .eq('id', user.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ── شريط المقياس ─────────────────────────────
  const scalePercent = Math.round(scale * 100);
  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value));
  };

  return (
    <div className="min-h-full px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-black mb-6" style={{ color: 'var(--text-main)' }}>
        الإعدادات
      </h1>

      <div className="space-y-4">

        {/* ── الإشعارات ── */}
        <Section icon={<Bell size={16} style={{ color: '#c0002a' }} />} title="الإشعارات">
          <ToggleRow
            label="تفعيل الإشعارات"
            sub="استقبال تنبيهات الإعجابات والرسائل"
            value={notifEnabled}
            onChange={setNotifEnabled}
          />
        </Section>

        {/* ── الخصوصية والظهور ── */}
        <Section icon={<Eye size={16} style={{ color: '#c0002a' }} />} title="الظهور والخصوصية">
          <ToggleRow
            label="إظهار ملفي الشخصي"
            sub="السماح للآخرين برؤية بطاقتك"
            value={profileVisible}
            onChange={setProfileVisible}
          />
          <ToggleRow
            label="تضبيب صوري"
            sub="تظهر صورك ضبابية حتى تأذن بالكشف"
            value={photosBlurred}
            onChange={setPhotosBlurred}
          />
        </Section>

        {/* ── المظهر ── */}
        <Section icon={<Sun size={16} style={{ color: '#c0002a' }} />} title="المظهر">

          {/* وضع العرض — 3 خيارات */}
          <div>
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-main)' }}>
              وضع العرض
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
              اختر الوضع أو اتبع إعداد النظام تلقائياً
            </p>
            <div className="flex gap-2">
              <ModeBtn
                active={mode === 'system'}
                onClick={() => setTheme('system')}
                icon={<Monitor size={16} />}
                label="النظام"
              />
              <ModeBtn
                active={mode === 'dark'}
                onClick={() => setTheme('dark')}
                icon={<Moon size={16} />}
                label="ليلي"
              />
              <ModeBtn
                active={mode === 'light'}
                onClick={() => setTheme('light')}
                icon={<Sun size={16} />}
                label="نهاري"
              />
            </div>
          </div>

          {/* حجم الخط والأيقونات — شريط مئوي */}
          <div>
            <p
              className="font-bold text-sm mb-1 flex items-center gap-2"
              style={{ color: 'var(--text-main)' }}
            >
              <Type size={14} style={{ color: 'var(--text-tertiary)' }} />
              حجم الخط والأيقونات
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              التطبيق يتبع حجم النظام افتراضياً — يمكنك الضبط يدوياً
            </p>

            {/* صف الشريط + الأزرار */}
            <div className="flex items-center gap-3 mb-3">
              {/* زر تصغير */}
              <button
                onClick={() => setScale(Math.max(MIN_SCALE, scale - 0.05))}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Minus size={14} />
              </button>

              {/* الشريط */}
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={MIN_SCALE}
                  max={MAX_SCALE}
                  step={0.05}
                  value={scale}
                  onChange={handleSlider}
                  className="w-full appearance-none h-1.5 rounded-full outline-none"
                  style={{
                    background: `linear-gradient(to left,
                      rgba(255,255,255,0.1) ${100 - ((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%,
                      #c0002a ${100 - ((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%
                    )`,
                    // ستايل الـ thumb عبر CSS في ما يلي
                  }}
                />
              </div>

              {/* زر تكبير */}
              <button
                onClick={() => setScale(Math.min(MAX_SCALE, scale + 0.05))}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Plus size={14} />
              </button>

              {/* النسبة */}
              <span
                className="flex-shrink-0 text-xs font-black w-10 text-center tabular-nums"
                style={{ color: '#ff4466' }}
              >
                {scalePercent}%
              </span>
            </div>

            {/* زر إعادة الضبط */}
            {scale !== DEFAULT_SCALE && (
              <button
                onClick={resetScale}
                className="text-xs font-bold underline transition-opacity active:opacity-60"
                style={{ color: 'var(--text-tertiary)' }}
              >
                إعادة الضبط للافتراضي
              </button>
            )}

            {/* معاينة نصية + أيقونة فورية */}
            <div
              className="mt-3 p-4 rounded-2xl flex flex-col items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* أيقونة معاينة */}
              <div className="flex items-center gap-3">
                <Bell   style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)', color: 'var(--text-tertiary)' }} />
                <Heart  style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)', color: '#c0002a' }} />
                <Moon   style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)', color: 'var(--text-tertiary)' }} />
              </div>
              {/* نص معاينة */}
              <p
                className="font-medium text-center"
                style={{ fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.6)' }}
              >
                هكذا سيظهر النص والأيقونات في التطبيق
              </p>
            </div>
          </div>

        </Section>

        {/* ── زر الحفظ ── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #800020, #c0002a)',
            boxShadow: '0 8px 25px rgba(192,0,42,0.4)',
            color: '#fff',
          }}
        >
          <Save size={18} />
          {saving ? 'جاري الحفظ...' : saved ? '✅ تم الحفظ!' : 'حفظ الإعدادات'}
        </button>

      </div>

      {/* CSS للـ range input thumb */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #c0002a;
          box-shadow: 0 2px 8px rgba(192,0,42,0.5);
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.3);
        }
        input[type=range]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #c0002a;
          box-shadow: 0 2px 8px rgba(192,0,42,0.5);
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}

// ── مكوّن Heart بسيط (Lucide لا يصدّره مباشرة) ──
function Heart({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// ── مكوّنات مساعدة ──────────────────────

function Section({
  icon, title, children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel p-5 space-y-5">
      <h2
        className="font-black text-sm border-b pb-3 flex items-center gap-2"
        style={{ color: 'var(--text-main)', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function ToggleRow({
  label, sub, value, onChange,
}: {
  label: string; sub: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0"
        style={{ background: value ? '#c0002a' : 'rgba(255,255,255,0.15)' }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
          style={{ [value ? 'right' : 'left']: '2px' }}
        />
      </button>
    </div>
  );
}

function ModeBtn({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
      style={{
        background: active ? 'rgba(192,0,42,0.2)' : 'rgba(255,255,255,0.05)',
        border: `1.5px solid ${active ? 'rgba(192,0,42,0.5)' : 'rgba(255,255,255,0.08)'}`,
        color: active ? '#ff4466' : 'rgba(255,255,255,0.45)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}