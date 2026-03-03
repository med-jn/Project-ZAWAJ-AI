'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Edit3, MapPin, Briefcase, GraduationCap, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useWallet } from '@/hooks/useWallet';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { wallet, totalBalance } = useWallet();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white animate-pulse font-black">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 py-6" dir="rtl">
      
      {/* الصورة والاسم */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative">
          <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-[#c0002a]/40 shadow-xl">
            <img
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.first_name}&background=800020&color=fff`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={() => {/* تعديل الصورة */}}
            className="absolute -bottom-2 -left-2 w-8 h-8 bg-[#c0002a] rounded-full flex items-center justify-center shadow-lg"
          >
            <Edit3 size={14} className="text-white" />
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">{profile?.first_name} {profile?.last_name}</h1>
          <p className="text-white/50 text-sm">@{profile?.username || 'مستخدم'}</p>
        </div>
      </div>

      {/* المحفظة */}
      <div className="glass-panel p-5 mb-6 flex justify-between items-center">
        <div>
          <p className="text-white/40 text-xs mb-1">رصيدك الكلي</p>
          <p className="text-white font-black text-2xl">{totalBalance} <span className="text-sm text-white/50">نقطة</span></p>
        </div>
        <div className="text-left space-y-1">
          <p className="text-[10px] text-white/30">مشترى: <span className="text-white/60">{wallet?.paid_balance || 0}</span></p>
          <p className="text-[10px] text-white/30">مكافآت: <span className="text-white/60">{wallet?.bonus_balance || 0}</span></p>
        </div>
        <button
          className="px-4 py-2 rounded-full text-xs font-black text-white"
          style={{ background: 'linear-gradient(135deg, #800020, #c0002a)' }}
        >
          شحن ⚡
        </button>
      </div>

      {/* بيانات الملف */}
      <div className="glass-panel p-5 mb-6 space-y-4">
        <h2 className="text-white font-black text-sm border-b border-white/10 pb-3">بياناتي</h2>
        <InfoRow icon={<MapPin size={16} className="text-[#c0002a]" />} label="الموقع" value={`${profile?.city}، ${profile?.country}`} />
        <InfoRow icon={<Briefcase size={16} className="text-[#c0002a]" />} label="المهنة" value={profile?.job} />
        <InfoRow icon={<GraduationCap size={16} className="text-[#c0002a]" />} label="التعليم" value={profile?.education_level} />
        <InfoRow icon={<Heart size={16} className="text-[#c0002a]" />} label="الحالة" value={profile?.marital_status} />
      </div>

      {/* اكتمال الملف */}
      <div className="glass-panel p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="text-white text-sm font-black">اكتمال الملف الشخصي</p>
          <p className="text-[#c0002a] font-black text-sm">{profile?.profile_completion_percent || 0}%</p>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${profile?.profile_completion_percent || 0}%`,
              background: 'linear-gradient(90deg, #800020, #c0002a)',
            }}
          />
        </div>
      </div>

      {/* زر تسجيل الخروج */}
      <button
        onClick={handleLogout}
        className="w-full py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-3 text-white/50 hover:text-white hover:border-white/30 transition-all font-bold"
      >
        <LogOut size={18} />
        تسجيل الخروج
      </button>
    </div>
  );
}

// مكون صغير لعرض بيانات الملف
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-white/40 text-xs w-16">{label}</span>
      <span className="text-white text-sm font-bold">{value || '—'}</span>
    </div>
  );
}