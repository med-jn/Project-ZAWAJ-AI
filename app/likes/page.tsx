"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

// تعريف أنواع البيانات لضمان عدم حدوث أخطاء
interface UserProfile {
  username: string;
  avatar_url: string;
  city: string;
  age: number;
}

interface LikeItem {
  id: string;
  profiles: UserProfile;
}

export default function LikesManager() {
  const [activeTab, setActiveTab] = useState('incoming');
  const [likedMe, setLikedMe] = useState<LikeItem[]>([]);
  const [iLiked, setILiked] = useState<LikeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetchAllData();

    // الاشتراك في التغييرات الحينية (Real-time)
    const channel = supabase
      .channel('likes_realtime_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'likes' 
      }, () => {
        fetchAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchAllData = async () => {
    if (!userId) return;
    setLoading(true);

    // 1. جلب الذين أعجبوا بي (Incoming)
    const { data: incoming } = await supabase
      .from('likes')
      .select('id, profiles:from_user(username, avatar_url, city, age)')
      .eq('to_user', userId);

    // 2. جلب الذين أعجبت بهم (Outgoing)
    const { data: outgoing } = await supabase
      .from('likes')
      .select('id, profiles:to_user(username, avatar_url, city, age)')
      .eq('from_user', userId);

    setLikedMe((incoming as any) || []);
    setILiked((outgoing as any) || []);
    setLoading(false);
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#b20022]"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'incoming', label: 'المعجبون', count: likedMe.length },
    { id: 'outgoing', label: 'أعجبت بهم', count: iLiked.length },
    { id: 'favorites', label: 'المفضلون', count: 0 },
  ];

  return (
    <div className="w-full max-w-md mx-auto min-h-screen px-4 pt-24 pb-40"> {/* pb-40 لحماية المحتوى من القائمة السفلية */}
      
      {/* التبويبات الحمراء الزجاجية اللامعة */}
      <div className="flex p-1.5 bg-[#b20022]/10 backdrop-blur-2xl rounded-2xl border border-[#b20022]/30 sticky top-20 z-30 shadow-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative w-full py-3.5 text-xs font-bold rounded-xl transition-all duration-500 overflow-hidden ${
              activeTab === tab.id 
              ? 'bg-[#b20022] text-white shadow-[0_0_25px_rgba(178,0,34,0.5)] border border-white/20' 
              : 'text-white/40 hover:text-white/80'
            }`}
          >
            {/* تأثير لمعان فوق الزر النشط */}
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            )}
            <span className="relative z-10">{tab.label}</span>
            {tab.count > 0 && (
              <span className="absolute top-1 left-1 bg-white text-[#b20022] text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* عرض البطاقات ثنائية التوزيع */}
      <div className="mt-10 grid grid-cols-2 gap-4">
        {activeTab === 'incoming' && likedMe.map((item) => (
          <UserCard key={item.id} profile={item.profiles} />
        ))}
        {activeTab === 'outgoing' && iLiked.map((item) => (
          <UserCard key={item.id} profile={item.profiles} />
        ))}
        
        {/* حالة عدم وجود بيانات */}
        {!loading && ((activeTab === 'incoming' && likedMe.length === 0) || (activeTab === 'outgoing' && iLiked.length === 0)) && (
          <div className="col-span-2 text-center py-20 text-white/30 text-sm">
            لا توجد بيانات لعرضها حالياً
          </div>
        )}
      </div>

      {loading && (
        <div className="col-span-2 text-center mt-10">
          <div className="inline-block animate-bounce text-[#b20022] font-bold">... جاري التحديث</div>
        </div>
      )}
    </div>
  );
}

// مكون البطاقة الفخم بنظام الشبكة الثنائية
function UserCard({ profile }: { profile: UserProfile }) {
  return (
    <div className="relative group aspect-[3/4.5] rounded-[2.5rem] overflow-hidden border border-white/5 bg-white/5 backdrop-blur-sm shadow-xl transition-all hover:border-[#b20022]/40 hover:scale-[1.02]">
      <img 
        src={profile?.avatar_url || 'https://via.placeholder.com/400'} 
        className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
        alt={profile?.username}
      />
      
      {/* تدرج لوني عميق */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      
      <div className="absolute bottom-4 right-4 left-4 text-right">
        <h3 className="text-white font-extrabold text-sm tracking-tight">{profile?.username}</h3>
        <div className="flex items-center justify-end gap-1.5 mt-1">
           <span className="text-white/50 text-[10px]">{profile?.city}</span>
           <span className="w-1 h-1 bg-[#b20022] rounded-full shadow-[0_0_5px_#b20022]" />
           <span className="text-white/50 text-[10px]">{profile?.age} سنة</span>
        </div>
      </div>

      {/* أيقونة الحالة (مثلاً متصل أو أعجبك) */}
      <div className="absolute top-4 left-4">
        <div className="bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 group-hover:bg-[#b20022] transition-colors duration-500">
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}