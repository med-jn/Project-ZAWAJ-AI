'use client';
/**
 * 📁 app/home/page.tsx — ZAWAJ AI
 * ✅ بدون نقاط/شراء/بادجات
 * ✅ زر فلاتر يفتح /filter
 * ✅ قراءة الفلاتر من sessionStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { motion }            from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { useRouter }         from 'next/navigation';
import { supabase }          from '@/lib/supabase/client';
import { MatchingEngine }    from '@/lib/services/MatchingEngine';
import UserCard              from '@/components/cards/usercard';
import {
  loadFilters,
  filtersAreActive,
  type DiscoveryFilters,
  DEFAULT_FILTERS,
} from '@/app/filter/page';

// ── ذاكرة البطاقات (sessionStorage) ──────────────────────────
const CACHE_KEY   = (uid: string) => `zawaj_seen_${uid}`;
const QUEUE_KEY   = (uid: string) => `zawaj_queue_${uid}`;
const SEEN_TTL_MS = 24 * 60 * 60 * 1000;
const QUEUE_TTL_MS = 60 * 60 * 1000;

function getSeenIds(uid: string): string[] {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY(uid));
    if (!raw) return [];
    const arr: { id: string; ts: number }[] = JSON.parse(raw);
    const cutoff = Date.now() - SEEN_TTL_MS;
    return arr.filter(x => x.ts > cutoff).map(x => x.id);
  } catch { return []; }
}

function addSeenId(uid: string, profileId: string) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY(uid));
    const arr: { id: string; ts: number }[] = raw ? JSON.parse(raw) : [];
    const cutoff = Date.now() - SEEN_TTL_MS;
    const filtered = arr.filter(x => x.ts > cutoff && x.id !== profileId);
    filtered.push({ id: profileId, ts: Date.now() });
    sessionStorage.setItem(CACHE_KEY(uid), JSON.stringify(filtered));
  } catch {}
}

function getCachedQueue(uid: string): any[] {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY(uid));
    if (!raw) return [];
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > QUEUE_TTL_MS) { sessionStorage.removeItem(QUEUE_KEY(uid)); return []; }
    return data ?? [];
  } catch { return []; }
}

function saveCachedQueue(uid: string, data: any[]) {
  try { sessionStorage.setItem(QUEUE_KEY(uid), JSON.stringify({ ts: Date.now(), data })); } catch {}
}

function clearCachedQueue(uid: string) {
  try { sessionStorage.removeItem(QUEUE_KEY(uid)); } catch {}
}

// ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [users,        setUsers]        = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [currentUser,  setCurrentUser]  = useState<any>(null);
  const [filters,      setFilters]      = useState<DiscoveryFilters>(DEFAULT_FILTERS);

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

    const cached = getCachedQueue(user.id);
    if (cached.length > 0) {
      setUsers(cached);
      setLoading(false);
      fetchFresh(user.id, profile, activeFilters, cached.length);
      return;
    }

    await fetchFresh(user.id, profile, activeFilters, 0);
  }, []);

  const fetchFresh = async (
    uid: string, profile: any,
    activeFilters: DiscoveryFilters, cacheLen: number,
  ) => {
    const seenIds = getSeenIds(uid);
    const { data: smartUsers } = await MatchingEngine.getSmartSuggestions(
      profile, { ...activeFilters, excludeIds: seenIds }
    );

    if (!smartUsers?.length) {
      if (cacheLen === 0) setUsers([]);
      setLoading(false);
      return;
    }

    saveCachedQueue(uid, smartUsers);
    if (cacheLen === 0) setUsers(smartUsers);
    setLoading(false);
  };

  // ── قراءة الفلاتر عند التركيز (العودة من /filter) ─────────
  useEffect(() => {
    const f = loadFilters();
    setFilters(f);
    load(f);
  }, [load]);

  // إعادة تحميل عند العودة من صفحة الفلاتر
  useEffect(() => {
    const onFocus = () => {
      const f = loadFilters();
      setFilters(f);
      if (currentUser) clearCachedQueue(currentUser.id);
      load(f);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [currentUser, load]);

  const handleNext = () => {
    if (!currentUser) return;
    const current = users[currentIndex];
    if (current) addSeenId(currentUser.id, current.id);
    setCurrentIndex(prev => prev + 1);
  };

  const active = filtersAreActive(filters);

  // ── حالات التحميل ─────────────────────────────────────────
  if (loading) return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)',
    }}>
      <motion.div
        animate={{ scale: [1, 1.14, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        style={{ fontSize: 48 }}
      >💍</motion.div>
    </div>
  );

  if (users.length === 0 || currentIndex >= users.length) {
    const finished = users.length > 0 && currentIndex >= users.length;
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 'var(--sp-5)', padding: '0 var(--sp-8)',
        background: 'var(--bg-main)',
      }}>
        <div style={{ fontSize: 64 }}>{finished ? '✨' : '🔍'}</div>
        <p style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'var(--text-xl)', textAlign: 'center', margin: 0 }}>
          {finished ? 'شاهدت كل البطاقات المتاحة' : 'لا توجد نتائج'}
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', margin: 0 }}>
          {active && !finished ? 'جرّب توسيع الفلاتر أو إعادة تعيينها' : 'عد لاحقاً لاكتشاف وجوه جديدة'}
        </p>
        {active && (
          <button onClick={() => router.push('/filter')}
            style={{
              padding: 'var(--sp-3) var(--sp-6)',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(192,0,42,0.15)',
              border: '1px solid rgba(192,0,42,0.3)',
              color: '#ff6680',
              fontWeight: 800, fontSize: 'var(--text-sm)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            تعديل الفلاتر
          </button>
        )}
      </div>
    );
  }

  const c = users[currentIndex];

  return (
    <div style={{ position: 'fixed', inset: 0 }}>

      {/* ── زر الفلاتر ─────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => router.push('/filter')}
        style={{
          position: 'fixed', top: 'var(--sp-4)', left: 'var(--sp-4)',
          zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
          padding: 'var(--sp-2) var(--sp-3)',
          borderRadius: 'var(--radius-lg)',
          background: active ? 'rgba(192,0,42,0.22)' : 'rgba(0,0,0,0.35)',
          border: `1px solid ${active ? 'rgba(192,0,42,0.5)' : 'rgba(255,255,255,0.12)'}`,
          backdropFilter: 'blur(12px)',
          color: active ? '#ff6680' : 'rgba(255,255,255,0.7)',
          fontSize: 'var(--text-xs)', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: active
            ? '0 4px 16px rgba(192,0,42,0.25)'
            : '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <SlidersHorizontal size={14} />
        {active ? 'فلاتر نشطة' : 'فلاتر'}
        {active && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#ff6680', display: 'inline-block',
          }} />
        )}
      </motion.button>

      {/* ── البطاقة ─────────────────────────────────────────── */}
      <UserCard
        userData={{
          id:          c.id,
          name:        c.full_name?.trim() || '—',
          age:         c.age,
          city:        c.city,
          gender:      c.gender,
          mainPhoto:   c.avatar_url || '/default-avatar.png',
          prefersBlur: c.is_photos_blurred,
          currentUser,
        }}
        onNext={handleNext}
      />
    </div>
  );
}