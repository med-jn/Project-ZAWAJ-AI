'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Users, 
  Star, 
  UserX, 
  Ban, 
  Filter, 
  MapPin, 
  Calendar,
  Search
} from 'lucide-react';

// ===== تعريف نوع البيانات لضمان الدقة =====
interface UserMiniCard {
  id: string;
  full_name: string;
  age: number;
  city: string;
  avatar_url: string;
  images?: string[];
  created_at?: string;
}

const LikesManager = () => {
  const [activeTab, setActiveTab] = useState('liked_me');
  const [filterVisible, setFilterVisible] = useState(false);

  // الخيارات الخمسة المطلوبة
  const tabs = [
    { id: 'liked_me', label: 'أعجبوا بي', icon: Users },
    { id: 'my_likes', label: 'أعجبت بهم', icon: Heart },
    { id: 'favorites', label: 'المفضلون', icon: Star },
    { id: 'ignored', label: 'تجاهلتهم', icon: UserX },
    { id: 'blocked', label: 'المحظورون', icon: Ban },
  ];

  // منطق اختيار الصورة (الأفاتار ملء الشاشة إذا لم توجد صور أخرى)
  const getDisplayImage = (user: UserMiniCard) => {
    if (user.images && user.images.length > 0 && user.images[0] !== '') {
      return user.images[0];
    }
    return user.avatar_url || '/default-avatar.png'; // رابط احتياطي
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-28">
      
      {/* الرأس (Header) */}
      <header className="flex justify-between items-center mb-6 mt-2">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-l from-pink-500 to-purple-500 bg-clip-text text-transparent">
            سجل التفاعلات
          </h1>
          <p className="text-xs text-zinc-500 mt-1">أدر علاقاتك وتفضيلاتك</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setFilterVisible(!filterVisible)}
          className="p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl icon-glow"
        >
          <Filter size={20} className="text-pink-400" />
        </motion.button>
      </header>

      {/* شريط التبويبات (Tabs) - سكرول أفقي ناعم */}
      <div className="flex overflow-x-auto gap-3 no-scrollbar mb-8 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-500 border ${
              activeTab === tab.id 
              ? 'bg-pink-600 border-pink-500 shadow-[0_0_15px_rgba(219,39,119,0.4)] text-white' 
              : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
            }`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? 'animate-pulse' : ''} />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* الشبكة الثنائية (Grid 2 Columns) */}
      <motion.div 
        layout
        className="grid grid-cols-2 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {/* هنا يتم ربط بيانات سوبابيز لاحقاً - وضعنا عينة حالياً */}
          {[1, 2, 3, 4].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden glass-card border-glow cursor-pointer"
            >
              {/* الصورة ملء الشاشة (منطق الأفاتار) */}
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500" 
                alt="User"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* التدرج اللوني لضمان وضوح النص */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              {/* معلومات المستخدم الصغير */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm font-bold truncate">سارة، 24</span>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-300">
                    <MapPin size={10} className="text-pink-500" />
                    <span className="truncate">تونس، أريانة</span>
                  </div>
                </div>
              </div>

              {/* وسم الحالة (اختياري حسب التبويب) */}
              <div className="absolute top-2 right-2">
                <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
                  <Heart size={12} className="text-pink-500 fill-pink-500" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* شريط الإجراءات السفلي للفلاتر (يظهر عند الضغط على الفلتر) */}
      <AnimatePresence>
        {filterVisible && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 left-4 right-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl z-50"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-sm">ترتيب حسب:</span>
              <button onClick={() => setFilterVisible(false)} className="text-xs text-pink-500">تم</button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {['الأحدث', 'الأقرب', 'العمر (أصغر)', 'العمر (أكبر)'].map((f) => (
                <button key={f} className="px-4 py-2 bg-black border border-zinc-800 rounded-lg text-xs whitespace-nowrap">
                  {f}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* رسالة عند خلو القائمة */}
      <div className="hidden flex-col items-center justify-center py-20 text-zinc-600">
        <Search size={48} className="mb-4 opacity-20" />
        <p>لا توجد نتائج في هذه القائمة</p>
      </div>

    </div>
  );
};

export default LikesManager;