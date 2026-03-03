'use client';
import { useState, useEffect } from 'react';
import { Bell, Eye, EyeOff, Globe, Moon, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [photosBlurred, setPhotosBlurred] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('is_photos_blurred').eq('id', user.id).single();
      if (data) setPhotosBlurred(data.is_photos_blurred ?? false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ is_photos_blurred: photosBlurred }).eq('id', user.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-full px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-black text-white mb-6">الإعدادات</h1>

      <div className="space-y-4">

        {/* إعدادات الإشعارات */}
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-white font-black text-sm border-b border-white/10 pb-3 flex items-center gap-2">
            <Bell size={16} className="text-[#c0002a]" /> الإشعارات
          </h2>
          <ToggleRow
            label="تفعيل الإشعارات"
            sub="استقبال تنبيهات الإعجابات والرسائل"
            value={notifEnabled}
            onChange={setNotifEnabled}
          />
        </div>

        {/* إعدادات الخصوصية */}
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-white font-black text-sm border-b border-white/10 pb-3 flex items-center gap-2">
            <Eye size={16} className="text-[#c0002a]" /> الظهور
          </h2>
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
        </div>

        {/* زر الحفظ */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-black text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(135deg, #800020, #c0002a)', boxShadow: '0 8px 25px rgba(192,0,42,0.4)' }}
        >
          <Save size={18} />
          {saving ? 'جاري الحفظ...' : saved ? '✅ تم الحفظ!' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, value, onChange }: {
  label: string; sub: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-white font-bold text-sm">{label}</p>
        <p className="text-white/40 text-xs mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${value ? 'bg-[#c0002a]' : 'bg-white/20'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${value ? 'right-0.5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}