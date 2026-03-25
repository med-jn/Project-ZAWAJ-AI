// 📁 app/home/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, MapPin, Calendar } from 'lucide-react';
import { supabase }       from '@/lib/supabase/client';
import { MatchingEngine } from '@/lib/services/MatchingEngine';
import { COUNTRIES_CITIES } from '@/constants/countries';
import UserCard            from '@/components/cards/usercard';
import ProfileModal        from '@/components/profile/ProfileModal';

// ── ذاكرة البطاقات (localStorage) ────────────────────────────
const CACHE_KEY    = (uid: string) => `zawaj_seen_${uid}`;
const QUEUE_KEY    = (uid: string) => `zawaj_queue_${uid}`;
const SEEN_TTL_MS  = 24 * 60 * 60 * 1000; // 24 ساعة
const QUEUE_TTL_MS = 60 * 60 * 1000;       // ساعة واحدة

function getSeenIds(uid: string): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY(uid));
    if (!raw) return [];
    const arr: { id: string; ts: number }[] = JSON.parse(raw);
    const cutoff = Date.now() - SEEN_TTL_MS;
    return arr.filter(x => x.ts > cutoff).map(x => x.id);
  } catch { return []; }
}

function addSeenId(uid: string, profileId: string) {
  try {
    const raw = localStorage.getItem(CACHE_KEY(uid));
    const arr: { id: string; ts: number }[] = raw ? JSON.parse(raw) : [];
    const cutoff = Date.now() - SEEN_TTL_MS;
    const filtered = arr.filter(x => x.ts > cutoff && x.id !== profileId);
    filtered.push({ id: profileId, ts: Date.now() });
    localStorage.setItem(CACHE_KEY(uid), JSON.stringify(filtered));
  } catch {}
}

function getCachedQueue(uid: string): any[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY(uid));
    if (!raw) return [];
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > QUEUE_TTL_MS) { localStorage.removeItem(QUEUE_KEY(uid)); return []; }
    return data ?? [];
  } catch { return []; }
}

function saveCachedQueue(uid: string, data: any[]) {
  try {
    localStorage.setItem(QUEUE_KEY(uid), JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function clearCachedQueue(uid: string) {
  try { localStorage.removeItem(QUEUE_KEY(uid)); } catch {}
}

// ─────────────────────────────────────────────────────────────
interface DiscoveryFilters {
  ageMin: number; ageMax: number; country: string; city: string;
}
const DEFAULT_FILTERS: DiscoveryFilters = { ageMin: 18, ageMax: 60, country: '', city: '' };

export default function HomePage() {
  const [users,         setUsers]         = useState<any[]>([]);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [currentUser,   setCurrentUser]   = useState<any>(null);
  const [showFilter,    setShowFilter]    = useState(false);
  const [filters,       setFilters]       = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [tempFilters,   setTempFilters]   = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [filtersActive, setFiltersActive] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const countries = Object.keys(COUNTRIES_CITIES);
  const cities    = tempFilters.country ? COUNTRIES_CITIES[tempFilters.country] ?? [] : [];

  // ── تحميل البطاقات ────────────────────────────────────────
  const load = useCallback(async (activeFilters: DiscoveryFilters) => {
    setLoading(true);
    setCurrentIndex(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    if (!profile) { setLoading(false); return; }
    setCurrentUser(profile);

    // ── قراءة الكاش أولاً ─────────────────────────────────
    const cached = getCachedQueue(user.id);
    if (cached.length > 0) {
      setUsers(cached);
      setLoading(false);
      // جلب بيانات جديدة في الخلفية لتجديد الكاش
      fetchFresh(user.id, profile, activeFilters, cached.length);
      return;
    }

    // ── لا كاش → جلب من السيرفر ───────────────────────────
    await fetchFresh(user.id, profile, activeFilters, 0);
  }, []);

  const fetchFresh = async (
    uid: string, profile: any,
    activeFilters: DiscoveryFilters, cacheLen: number,
  ) => {
    const seenIds = getSeenIds(uid);

    // استدعاء MatchingEngine مع استبعاد المرئيين
    const { data: smartUsers } = await MatchingEngine.getSmartSuggestions(
      profile, { ...activeFilters, excludeIds: seenIds }
    );

    if (!smartUsers?.length) {
      // انتهت البطاقات الجديدة — إذا كان هناك كاش فاحتفظ به
      if (cacheLen === 0) setUsers([]);
      setLoading(false);
      return;
    }

    // حفظ الكاش الجديد
    saveCachedQueue(uid, smartUsers);
    if (cacheLen === 0) setUsers(smartUsers);
    setLoading(false);
  };

  useEffect(() => { load(DEFAULT_FILTERS); }, [load]);

  // ── الانتقال للبطاقة التالية ─────────────────────────────
  // التسجيل والخصم يحدثان في UserCard مباشرة
  const handleNext = () => {
    if (!currentUser) return;
    const current = users[currentIndex];
    if (current) addSeenId(currentUser.id, current.id);
    setCurrentIndex(prev => prev + 1);
  };

  // ── تطبيق الفلاتر ─────────────────────────────────────────
  const applyFilters = () => {
    const active = tempFilters.ageMin !== 18 || tempFilters.ageMax !== 60
      || tempFilters.country !== '' || tempFilters.city !== '';
    setFilters(tempFilters);
    setFiltersActive(active);
    setShowFilter(false);
    if (currentUser) clearCachedQueue(currentUser.id);
    load(tempFilters);
  };

  const resetFilters = () => {
    setTempFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setFiltersActive(false);
    setShowFilter(false);
    if (currentUser) clearCachedQueue(currentUser.id);
    load(DEFAULT_FILTERS);
  };

  // ── حالات التحميل ─────────────────────────────────────────
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg-luxury-gradient)' }}>
      <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-5xl">💍</motion.div>
    </div>
  );

  if (users.length === 0) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 px-8"
      style={{ background: 'var(--bg-luxury-gradient)' }}>
      <div className="text-7xl">🔍</div>
      <p className="text-white font-black text-xl text-center">لا توجد نتائج</p>
      <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm text-center">
        {filtersActive ? 'جرّب توسيع الفلاتر أو إعادة تعيينها' : 'عد لاحقاً لاكتشاف وجوه جديدة'}
      </p>
      {filtersActive && (
        <button onClick={resetFilters}
          className="px-6 py-3 rounded-2xl font-black text-white text-sm"
          style={{ background: 'rgba(192,0,42,0.2)', border: '1px solid rgba(192,0,42,0.3)' }}>
          إعادة تعيين الفلاتر
        </button>
      )}
    </div>
  );

  if (currentIndex >= users.length) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 px-8"
      style={{ background: 'var(--bg-luxury-gradient)' }}>
      <div className="text-7xl">✨</div>
      <p className="text-white font-black text-xl text-center">شاهدت كل البطاقات المتاحة</p>
      <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm text-center">
        عد لاحقاً لاكتشاف وجوه جديدة
      </p>
    </div>
  );

  const c = users[currentIndex];

  return (
    <div className="fixed inset-0">

      {/* ── زر الفلاتر ────────────────────────────────────── */}
      <button
        onClick={() => { setTempFilters(filters); setShowFilter(true); }}
        className="fixed top-4 left-4 z-[200] flex items-center gap-2 px-3 py-2 rounded-2xl"
        style={{
          background: filtersActive ? 'rgba(192,0,42,0.25)' : 'rgba(0,0,0,0.4)',
          border: `1px solid ${filtersActive ? 'rgba(192,0,42,0.5)' : 'rgba(255,255,255,0.12)'}`,
          backdropFilter: 'blur(20px)',
          color: filtersActive ? '#ff6680' : 'rgba(255,255,255,0.7)',
          fontSize: 12, fontWeight: 600,
        }}
      >
        <SlidersHorizontal size={14} />
        {filtersActive ? 'فلاتر نشطة' : 'فلاتر'}
      </button>

      {/* ── البطاقة ────────────────────────────────────────── */}
      <UserCard
        userData={{
          id:                   c.id,
          name:                 c.full_name?.trim() || '—',
          age:                  c.age,
          city:                 c.city,
          gender:               c.gender,
          mainPhoto:            c.avatar_url || '/default-avatar.png',
          prefersBlur:          c.is_photos_blurred,
          badge_type:           MatchingEngine.extractBadge(c.wallets),
          religious_commitment: c.religious_commitment,
          currentUser,
        }}
        onNext={handleNext}
        onViewProfile={setProfileUserId}
      />

      {/* ══ ProfileModal ════════════════════════════════════ */}
      <AnimatePresence>
        {profileUserId && (
          <ProfileModal
            userId={profileUserId}
            currentUser={currentUser}
            onClose={() => setProfileUserId(null)}
          />
        )}
      </AnimatePresence>

      {/* ══ لوحة الفلاتر ═════════════════════════════════════ */}
      <AnimatePresence>
        {showFilter && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500]"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowFilter(false)}
            />
            <motion.div
              dir="rtl"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[600] rounded-t-[32px] flex flex-col"
              style={{
                background: 'rgba(9,0,9,0.98)',
                backdropFilter: 'blur(50px)',
                border: '1px solid rgba(255,255,255,0.08)',
                maxHeight: '80vh',
              }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="text-white font-black text-base">فلاتر البحث</h3>
                <button onClick={() => setShowFilter(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center">
                  <X size={17} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">
                {/* نطاق العمر */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={15} style={{ color: '#c0002a' }} />
                    <span className="text-white font-black text-sm">نطاق العمر</span>
                    <span className="mr-auto text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: 'rgba(192,0,42,0.15)', color: '#ff6680' }}>
                      {tempFilters.ageMin} — {tempFilters.ageMax} سنة
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        من {tempFilters.ageMin} سنة
                      </span>
                    </div>
                    <input type="range" min={18} max={tempFilters.ageMax - 1}
                      value={tempFilters.ageMin}
                      onChange={e => setTempFilters(p => ({ ...p, ageMin: parseInt(e.target.value) }))}
                      className="w-full h-1.5 rounded-full cursor-pointer"
                      style={{ accentColor: '#c0002a' }}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        إلى {tempFilters.ageMax} سنة
                      </span>
                    </div>
                    <input type="range" min={tempFilters.ageMin + 1} max={80}
                      value={tempFilters.ageMax}
                      onChange={e => setTempFilters(p => ({ ...p, ageMax: parseInt(e.target.value) }))}
                      className="w-full h-1.5 rounded-full cursor-pointer"
                      style={{ accentColor: '#c0002a' }}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>80</span>
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>18</span>
                    </div>
                  </div>
                </div>

                {/* الموقع */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={15} style={{ color: '#c0002a' }} />
                    <span className="text-white font-black text-sm">الموقع الجغرافي</span>
                    {(tempFilters.country || tempFilters.city) && (
                      <button onClick={() => setTempFilters(p => ({ ...p, country: '', city: '' }))}
                        className="mr-auto text-[10px] px-2 py-1 rounded-full"
                        style={{ color: 'rgba(255,100,100,0.7)', background: 'rgba(255,50,50,0.08)' }}>
                        مسح
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <select dir="rtl" value={tempFilters.country}
                      onChange={e => setTempFilters(p => ({ ...p, country: e.target.value, city: '' }))}
                      className="w-full px-4 py-3 rounded-[14px] text-[13px] text-white outline-none"
                      style={{ background: 'rgba(7,2,10,0.95)', border: '1px solid rgba(255,255,255,0.09)', fontFamily: 'inherit' }}>
                      <option value="">— كل الدول —</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select dir="rtl" value={tempFilters.city}
                      onChange={e => setTempFilters(p => ({ ...p, city: e.target.value }))}
                      disabled={!tempFilters.country}
                      className="w-full px-4 py-3 rounded-[14px] text-[13px] text-white outline-none"
                      style={{
                        background: 'rgba(7,2,10,0.95)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        fontFamily: 'inherit',
                        opacity: tempFilters.country ? 1 : 0.4,
                      }}>
                      <option value="">— كل المدن —</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-8 pt-4 flex gap-3 border-t border-white/10">
                <button onClick={resetFilters}
                  className="flex-1 py-3.5 rounded-2xl font-black text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  إعادة تعيين
                </button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={applyFilters}
                  className="flex-[2] py-3.5 rounded-2xl font-black text-sm text-white"
                  style={{ background: 'linear-gradient(135deg,#800020,#c0002a)', boxShadow: '0 6px 20px rgba(192,0,42,0.4)' }}>
                  تطبيق الفلاتر ←
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}