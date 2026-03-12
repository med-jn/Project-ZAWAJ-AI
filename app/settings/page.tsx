'use client';
/**
 * 📁 app/settings/page.tsx
 * الإعدادات: خصوصية + مظهر (لايت مود + حجم خط) + إشعارات
 */
import { useState, useEffect } from 'react';
import { Bell, Eye, Save, Sun, Moon, Type } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// ── أحجام الخط ──────────────────────────
const FONT_SIZES = [
  { label: 'صغير',  value: '14px', sample: 'ص' },
  { label: 'متوسط', value: '16px', sample: 'م' },
  { label: 'كبير',  value: '18px', sample: 'ك' },
];

export default function SettingsPage() {
  // إعدادات الخصوصية
  const [notifEnabled,   setNotifEnabled]   = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [photosBlurred,  setPhotosBlurred]  = useState(false);

  // إعدادات المظهر
  const [isLight,  setIsLight]  = useState(false);
  const [fontSize, setFontSize] = useState('16px');

  // حالة الحفظ
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // ── قراءة الإعدادات المحفوظة ──
  useEffect(() => {
    // من Supabase
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

    // من localStorage
    const theme    = localStorage.getItem('zawaj-theme');
    const fontSave = localStorage.getItem('zawaj-font');
    if (theme === 'light') setIsLight(true);
    if (fontSave) setFontSize(fontSave);
  }, []);

  // ── تطبيق الثيم ──────────────────────
  const applyTheme = (light: boolean) => {
    setIsLight(light);
    document.documentElement.classList.toggle('light', light);
    localStorage.setItem('zawaj-theme', light ? 'light' : 'dark');
  };

  // ── تطبيق حجم الخط ───────────────────
  // نستخدم CSS variable على :root بدل fontSize على html
  // لأن Tailwind يتعارض مع fontSize على html مباشرة
  const applyFont = (size: string) => {
    setFontSize(size);
    // تطبيق فوري
    document.documentElement.style.setProperty('--base-font-size', size);
    // حفظ
    localStorage.setItem('zawaj-font', size);
  };

  // ── حفظ إعدادات Supabase ─────────────
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

  return (
    <div className="min-h-full px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-black vae(--text-on-main) mb-6">الإعدادات</h1>

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

          {/* لايت مود / دارك مود */}
          <div>
            <p className="var(--text-on-main) font-bold text-sm mb-1">وضع العرض</p>
            <p className="var(--text-tertiary)/40 text-xs mb-3">اختر بين الوضع الليلي والنهاري</p>
            <div className="flex gap-2">
              <ModeBtn
                active={!isLight}
                onClick={() => applyTheme(false)}
                icon={<Moon size={16} />}
                label="ليلي"
              />
              <ModeBtn
                active={isLight}
                onClick={() => applyTheme(true)}
                icon={<Sun size={16} />}
                label="نهاري"
              />
            </div>
          </div>

          {/* حجم الخط */}
          <div>
            <p className="var(--text-on-main) font-bold text-sm mb-1 flex items-center gap-2">
              <Type size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
              حجم الخط
            </p>
            <p className="var(--text-tertiary)/40 text-xs mb-3">اختر حجم النص المناسب لعينيك</p>

            <div className="flex gap-2">
              {FONT_SIZES.map(f => (
                <button
                  key={f.value}
                  onClick={() => applyFont(f.value)}
                  className="flex-1 flex flex-col items-center gap-2 py-3.5 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: fontSize === f.value
                      ? 'rgba(192,0,42,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${fontSize === f.value
                      ? 'rgba(192,0,42,0.5)'
                      : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {/* عيّنة مرئية لحجم الخط */}
                  <span
                    className="font-black"
                    style={{
                      color: fontSize === f.value ? '#ff4466' : 'rgba(255,255,255,0.5)',
                      fontSize: f.value === '14px' ? '16px'
                              : f.value === '16px' ? '20px'
                              : '26px',
                      lineHeight: 1,
                    }}
                  >
                    {f.sample}
                  </span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: fontSize === f.value ? '#ff4466' : 'rgba(255,255,255,0.35)' }}
                  >
                    {f.label}
                  </span>
                </button>
              ))}
            </div>

            {/* معاينة نصية فورية */}
            <div
              className="mt-3 p-3 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p
                className="var(--text-on-main)/60 font-medium"
                style={{ fontSize: fontSize }}
              >
                هكذا سيظهر النص في التطبيق
              </p>
            </div>
          </div>
        </Section>

        {/* ── زر الحفظ ── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-black var(--text-on-main) transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #800020, #c0002a)',
            boxShadow: '0 8px 25px rgba(192,0,42,0.4)',
          }}
        >
          <Save size={18} />
          {saving ? 'جاري الحفظ...' : saved ? '✅ تم الحفظ!' : 'حفظ الإعدادات'}
        </button>

      </div>
    </div>
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
        className="var(--text-on-main) font-black text-sm border-b border-white/10 pb-3 flex items-center gap-2"
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
        <p className="var(--text-on-main) font-bold text-sm">{label}</p>
        <p className="var(--text-tertiary)/40 text-xs mt-0.5">{sub}</p>
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