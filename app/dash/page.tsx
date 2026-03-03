'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Search, Filter, ChevronLeft, MapPin, Heart, GraduationCap, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { COUNTRIES_CITIES } from '@/constants/countries';
import { EDUCATION_LEVELS, RELIGIOUS_COMMITMENT, getMediatorLevel } from '@/constants/constants';

export default function MediatorDashPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'male' | 'female'>('male');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ country: '', city: '', education: '', commitment: '' });
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [stats, setStats] = useState({ monthlySubs: 0, maleCount: 0, femaleCount: 0, successMatches: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subsData } = await supabase.from('profiles').select('*').eq('mediator_id', user.id);
      setSubscribers(subsData || []);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count } = await supabase.from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('mediator_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: medData } = await supabase.from('profiles').select('success_count').eq('id', user.id).single();

      setStats({
        monthlySubs: count || 0,
        maleCount: subsData?.filter(s => s.gender === 'male').length || 0,
        femaleCount: subsData?.filter(s => s.gender === 'female').length || 0,
        successMatches: medData?.success_count || 0,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredList = useMemo(() => {
    return subscribers.filter(s => {
      return s.gender === activeTab
        && (s.first_name + ' ' + s.last_name).toLowerCase().includes(searchTerm.toLowerCase())
        && (!filters.country || s.country === filters.country)
        && (!filters.city || s.city === filters.city)
        && (!filters.education || s.education_level === filters.education)
        && (!filters.commitment || s.religious_commitment === filters.commitment);
    });
  }, [subscribers, activeTab, searchTerm, filters]);

  const currentLevel = getMediatorLevel(stats.monthlySubs);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <p className="font-black animate-pulse text-white">جاري تحميل لوحة التحكم...</p>
    </div>
  );

  return (
    <div className="min-h-full pb-10 px-4" dir="rtl">
      
      {/* هيدر الوسيط */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-8 mb-6 relative overflow-hidden border border-white/10">
        <div className="flex items-center gap-5 relative z-10">
          <div className="h-20 w-20 bg-gradient-to-br from-zinc-700 to-black rounded-[1.5rem] flex items-center justify-center border border-white/20">
            <Crown size={36} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-2xl font-black text-white">لوحة الوسيط</h2>
              <span className="px-3 py-1 bg-amber-400 text-black rounded-xl text-xs font-black">
                {currentLevel.badge} {currentLevel.name}
              </span>
            </div>
            <p className="text-zinc-400 text-sm">{stats.monthlySubs} اشتراك هذا الشهر</p>
          </div>
        </div>
        
        {/* إحصائيات */}
        <div className="flex gap-3 mt-6 relative z-10">
          <div className="flex-1 bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <p className="text-blue-400 font-black text-xl">{stats.maleCount}</p>
            <p className="text-zinc-500 text-[10px] font-bold">ذكور</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <p className="text-pink-400 font-black text-xl">{stats.femaleCount}</p>
            <p className="text-zinc-500 text-[10px] font-bold">إناث</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <p className="text-green-400 font-black text-xl">{stats.successMatches}</p>
            <p className="text-zinc-500 text-[10px] font-bold">نجاح</p>
          </div>
        </div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-400/10 blur-[60px]" />
      </div>

      {/* البحث والفلترة */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text" placeholder="البحث بالاسم..."
            className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 pr-11 text-sm outline-none focus:border-[#c0002a]/50"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`px-5 py-3 rounded-2xl flex items-center gap-2 font-black text-sm transition-all ${showFilter ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
        >
          <Filter size={16} /> فلترة
        </button>
      </div>

      {/* فلاتر متقدمة */}
      <AnimatePresence>
        {showFilter && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'الدولة', key: 'country', options: Object.keys(COUNTRIES_CITIES) },
                { label: 'المدينة', key: 'city', options: filters.country ? COUNTRIES_CITIES[filters.country] : [] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="text-white/40 text-[10px] font-black mb-1 block">{label}</label>
                  <select
                    value={filters[key as keyof typeof filters]}
                    onChange={e => setFilters({ ...filters, [key]: e.target.value, ...(key === 'country' ? { city: '' } : {}) })}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2 px-3 text-xs outline-none"
                  >
                    <option value="">الكل</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* تبديل الجنس */}
      <div className="flex bg-white/5 p-1.5 rounded-2xl gap-2 mb-6">
        <button
          onClick={() => setActiveTab('male')}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'male' ? 'bg-white text-blue-600 shadow' : 'text-zinc-500'}`}
        >
          الذكور ({stats.maleCount})
        </button>
        <button
          onClick={() => setActiveTab('female')}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'female' ? 'bg-white text-pink-600 shadow' : 'text-zinc-500'}`}
        >
          الإناث ({stats.femaleCount})
        </button>
      </div>

      {/* قائمة المشتركين */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredList.map(sub => (
            <motion.div
              key={sub.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-5 flex items-center gap-4"
            >
              <div className="h-16 w-16 rounded-[1.2rem] overflow-hidden flex-shrink-0 bg-zinc-800">
                <img src={sub.avatar_url || `https://ui-avatars.com/api/?name=${sub.first_name}&background=800020&color=fff`} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-black">{sub.first_name} {sub.last_name}</h4>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-white/40 text-xs flex items-center gap-1"><MapPin size={10} /> {sub.city}</span>
                  <span className="text-white/40 text-xs">{sub.age} سنة</span>
                </div>
              </div>
              <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                <ChevronLeft size={18} className="text-white/60" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredList.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">لا توجد نتائج</p>
          </div>
        )}
      </div>
    </div>
  );
}