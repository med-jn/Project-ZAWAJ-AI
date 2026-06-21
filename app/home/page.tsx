'use client';
/**
 * 📁 app/home/page.tsx — ZAWAJ AI v6
 * ✅ جلب show_photos من profiles وتمريره لـ UserCard
 * ✅ الاستيرادات من @/components/filter/types
 * ✅ دعم فلتر المسافة الجغرافية (radiusKm / searchLat / searchLon)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion }            from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { useRouter }         from 'next/navigation';
import { supabase }          from '@/lib/supabase/client';
import { MatchingEngine }    from '@/lib/services/MatchingEngine';
import UserCard              from '@/components/cards/usercard';

import {
  loadFilters,
  saveFilters,
  filtersAreActive,
  FILTER_STORAGE_KEY,
  type DiscoveryFilters,
  DEFAULT_FILTERS,
} from '@/components/filter/types';

// ══════════════════════════════════════════════════════════════
// Storage helpers
// ══════════════════════════════════════════════════════════════
const LS_INDEX_KEY = (uid: string) => `zawaj_idx_${uid}`;
const LS_CYCLE_KEY = (uid: string) => `zawaj_cycle_${uid}`;
const LS_QUEUE_KEY = (uid: string) => `zawaj_queue_${uid}`;
const LS_FHASH_KEY = (uid: string) => `zawaj_fhash_${uid}`;
const QUEUE_TTL    = 2 * 60 * 60 * 1000;

function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function lsDel(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

function hashFilters(f: DiscoveryFilters): string {
  return JSON.stringify(f);
}

function getCachedQueue(uid: string): any[] | null {
  try {
    const raw = localStorage.getItem(LS_QUEUE_KEY(uid));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > QUEUE_TTL) { lsDel(LS_QUEUE_KEY(uid)); return null; }
    return data ?? null;
  } catch { return null; }
}
function saveCachedQueue(uid: string, data: any[]) {
  try { localStorage.setItem(LS_QUEUE_KEY(uid), JSON.stringify({ ts: Date.now(), data })); } catch {}
}
function clearCachedQueue(uid: string) { lsDel(LS_QUEUE_KEY(uid)); }

async function savePositionToSupabase(uid: string, index: number, cycle: number) {
  try {
    await supabase.from('profiles')
      .update({ discovery_position: { index, cycle, ts: Date.now() } } as any)
      .eq('id', uid);
  } catch {}
}
async function loadPositionFromSupabase(
  uid: string,
): Promise<{ index: number; cycle: number } | null> {
  try {
    const { data } = await supabase.from('profiles')
      .select('discovery_position').eq('id', uid).single();
    if (!data?.discovery_position) return null;
    const pos = data.discovery_position as {
      index: number; cycle: number; ts: number;
    };
    if (Date.now() - (pos.ts ?? 0) > 7 * 24 * 60 * 60 * 1000) return null;
    return { index: pos.index ?? 0, cycle: pos.cycle ?? 0 };
  } catch { return null; }
}

let _savePosTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSavePosition(uid: string, index: number, cycle: number) {
  if (_savePosTimer) clearTimeout(_savePosTimer);
  _savePosTimer = setTimeout(() => savePositionToSupabase(uid, index, cycle), 4000);
}

// ══════════════════════════════════════════════════════════════
export default function HomePage() {
  const router = useRouter();

  const [users,        setUsers]        = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycle,        setCycle]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [currentUser,  setCurrentUser]  = useState<any>(null);
  const [filters,      setFilters]      = useState<DiscoveryFilters>(DEFAULT_FILTERS);

  const uidRef     = useRef<string | null>(null);
  const usersRef   = useRef<any[]>([]);
  const cycleRef   = useRef(0);
  const profileRef = useRef<any>(null);

  useEffect(() => { usersRef.current = users;  }, [users]);
  useEffect(() => { cycleRef.current = cycle;  }, [cycle]);

  // ══════════════════════════════════════════════════════════
  const fetchFresh = useCallback(async (
    uid: string,
    profile: any,
    activeFilters: DiscoveryFilters,
    opts: {
      silent?:        boolean;
      restoreIndex?:  number;
      restoreCycle?:  number;
    } = {}
  ) => {
    const { silent = false, restoreIndex = 0, restoreCycle = 0 } = opts;

    const { data: smartUsers } = await MatchingEngine.getSmartSuggestions(
      profile,
      activeFilters,
    );

    if (!smartUsers?.length) {
      if (!silent) { setUsers([]); setLoading(false); }
      return;
    }

    saveCachedQueue(uid, smartUsers);
    lsSet(LS_FHASH_KEY(uid), hashFilters(activeFilters));

    if (!silent) {
      setUsers(smartUsers);
      const safeIdx = restoreIndex < smartUsers.length ? restoreIndex : 0;
      setCurrentIndex(safeIdx);
      setCycle(restoreCycle);
      setLoading(false);
    }
  }, []);

  // ══════════════════════════════════════════════════════════
  const load = useCallback(async (opts: { forceRefresh?: boolean } = {}) => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    uidRef.current = user.id;

    // ✅ جلب show_photos ضمن select البروفايل
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, show_photos')
      .eq('id', user.id)
      .single();

    if (!profile) { setLoading(false); return; }
    setCurrentUser(profile);
    profileRef.current = profile;

    const activeFilters = loadFilters();
    setFilters(activeFilters);

    const uid = user.id;

    const savedHash   = lsGet<string>(LS_FHASH_KEY(uid), '');
    const currentHash = hashFilters(activeFilters);
    const filtersChanged = savedHash !== currentHash;

    if (filtersChanged || opts.forceRefresh) {
      clearCachedQueue(uid);
      lsDel(LS_INDEX_KEY(uid));
      lsDel(LS_CYCLE_KEY(uid));
      await fetchFresh(uid, profile, activeFilters, {
        restoreIndex: 0, restoreCycle: 0,
      });
      return;
    }

    let savedIndex = 0, savedCycle = 0;
    const lsIdx = lsGet<number>(LS_INDEX_KEY(uid), -1);
    if (lsIdx >= 0) {
      savedIndex = lsIdx;
      savedCycle = lsGet<number>(LS_CYCLE_KEY(uid), 0);
    } else {
      const supaPos = await loadPositionFromSupabase(uid);
      if (supaPos) {
        savedIndex = supaPos.index;
        savedCycle = supaPos.cycle;
        lsSet(LS_INDEX_KEY(uid), savedIndex);
        lsSet(LS_CYCLE_KEY(uid), savedCycle);
      }
    }

    const cached = getCachedQueue(uid);
    if (cached && cached.length > 0) {
      setUsers(cached);
      setCurrentIndex(savedIndex < cached.length ? savedIndex : 0);
      setCycle(savedCycle);
      setLoading(false);
      fetchFresh(uid, profile, activeFilters, {
        silent: true, restoreIndex: savedIndex, restoreCycle: savedCycle,
      });
      return;
    }

    await fetchFresh(uid, profile, activeFilters, {
      restoreIndex: savedIndex, restoreCycle: savedCycle,
    });
  }, [fetchFresh]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = () => {
      if (!uidRef.current) return;
      const newFilters  = loadFilters();
      const savedHash   = lsGet<string>(LS_FHASH_KEY(uidRef.current), '');
      const currentHash = hashFilters(newFilters);
      if (savedHash !== currentHash) load({ forceRefresh: false });
    };
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [load]);

  // ══════════════════════════════════════════════════════════
  const handleNext = useCallback(() => {
    if (!currentUser || !uidRef.current) return;

    setCurrentIndex(prevIdx => {
      const total      = usersRef.current.length;
      const nextIdx    = prevIdx + 1;
      let   finalIdx   = nextIdx;
      let   finalCycle = cycleRef.current;

      if (nextIdx >= total) {
        finalIdx   = 0;
        finalCycle = cycleRef.current + 1;
        setCycle(finalCycle);

        if (uidRef.current && profileRef.current) {
          const activeFilters = loadFilters();
          fetchFresh(uidRef.current, profileRef.current, activeFilters, {
            silent: true, restoreIndex: 0, restoreCycle: finalCycle,
          });
        }
      }

      lsSet(LS_INDEX_KEY(uidRef.current!), finalIdx);
      lsSet(LS_CYCLE_KEY(uidRef.current!), finalCycle);
      scheduleSavePosition(uidRef.current!, finalIdx, finalCycle);
      return finalIdx;
    });
  }, [currentUser, fetchFresh]);

  const active = filtersAreActive(filters);

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div style={{
      position:        'fixed',
      inset:            0,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      background:      'var(--bg-main)',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{
          width:           36,
          height:          36,
          borderRadius:   '50%',
          border:         '3px solid var(--glass-border)',
          borderTopColor: 'var(--color-primary)',
        }}
      />
    </div>
  );

  // ── لا نتائج ─────────────────────────────────────────────
  if (users.length === 0) return (
    <div style={{
      position:        'fixed',
      inset:            0,
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             'var(--sp-5)',
      padding:         '0 var(--sp-8)',
      background:      'var(--bg-main)',
      direction:       'rtl',
    }}>
      <div style={{
        width:          72,
        height:         72,
        borderRadius:  '50%',
        background:    'var(--glass-bg)',
        border:        '1px solid var(--glass-border)',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
      }}>
        <SlidersHorizontal
          size={28}
          style={{ color: 'var(--color-primary)', opacity: 0.7 }}
        />
      </div>
      <p style={{
        color:      'var(--text-main)',
        fontWeight:  900,
        fontSize:   'var(--text-xl)',
        textAlign:  'center',
        margin:      0,
      }}>لا توجد نتائج</p>
      <p style={{
        color:     'var(--text-tertiary)',
        fontSize:  'var(--text-sm)',
        textAlign: 'center',
        margin:     0,
      }}>
        {active ? 'جرّب توسيع نطاق الفلاتر' : 'عد لاحقاً لاكتشاف ملفات جديدة'}
      </p>
      {active && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => router.push('/filter')}
          style={{
            padding:         'var(--sp-3) var(--sp-6)',
            borderRadius:    'var(--radius-lg)',
            background:      'var(--color-primary-xsoft)',
            border:          '1px solid var(--color-primary-soft)',
            color:           'var(--color-primary)',
            fontWeight:       800,
            fontSize:        'var(--text-sm)',
            cursor:          'pointer',
            fontFamily:      'inherit',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          تعديل الفلاتر
        </motion.button>
      )}
    </div>
  );

  const safeIndex   = currentIndex % users.length;
  const c           = users[safeIndex];
  const isGeoSearch = !!(filters.radiusKm && filters.searchLat);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>

      {/* زر الفلاتر */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => router.push('/filter')}
        style={{
          position:        'fixed',
          top:             'calc(var(--header-h, 0px) + var(--sp-3))',
          left:             'var(--sp-4)',
          zIndex:           200,
          display:         'flex',
          alignItems:      'center',
          gap:             'var(--sp-2)',
          padding:         'var(--sp-2) var(--sp-3)',
          borderRadius:    'var(--radius-lg)',
          background:       active ? 'rgba(192,0,42,0.18)' : 'rgba(0,0,0,0.28)',
          border:          `1px solid ${active ? 'rgba(192,0,42,0.4)' : 'rgba(255,255,255,0.12)'}`,
          backdropFilter:  'blur(14px)',
          color:            active ? '#ff6680' : 'rgba(255,255,255,0.72)',
          fontSize:        'var(--text-xs)',
          fontWeight:       700,
          cursor:          'pointer',
          fontFamily:      'inherit',
          boxShadow:        active
            ? '0 4px 16px rgba(192,0,42,0.22)'
            : '0 4px 12px rgba(0,0,0,0.18)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <SlidersHorizontal size={14} />
        {isGeoSearch
          ? `${filters.radiusKm} كم`
          : active ? 'فلاتر نشطة' : 'فلاتر'
        }
        {active && (
          <span style={{
            width:        6,
            height:       6,
            borderRadius: '50%',
            background:   '#ff6680',
            display:      'inline-block',
            flexShrink:    0,
          }} />
        )}
      </motion.button>

      {/* مؤشر الدورة */}
      {cycle > 0 && (
        <div style={{
          position:       'fixed',
          top:            'calc(var(--header-h, 0px) + var(--sp-3))',
          right:          'var(--sp-4)',
          zIndex:          200,
          padding:        'var(--sp-1) var(--sp-3)',
          borderRadius:   'var(--radius-lg)',
          background:     'rgba(0,0,0,0.28)',
          border:         '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(14px)',
          color:          'rgba(255,255,255,0.45)',
          fontSize:       'var(--text-xs)',
          fontWeight:      600,
          direction:      'rtl',
        }}>
          جولة {cycle + 1}
        </div>
      )}

      {/* ── البطاقة ── */}
      <UserCard
        key={`${c.id}-${cycle}`}
        userData={{
          id:          c.id,
          name:        c.full_name?.trim() || '—',
          age:         c.age,
          city:        c.city,
          gender:      c.gender,
          mainPhoto:   c.avatar_url || '/default-avatar.png',
          // ✅ is_photos_blurred: خيار صاحب البطاقة
          prefersBlur: c.is_photos_blurred ?? false,
          // ✅ show_photos: خيار المستخدم الحالي (false = يضبب الكل)
          showPhotos:  currentUser?.show_photos ?? true,
          currentUser,
          distanceKm:  (c as any).distance_km ?? null,
        }}
        onNext={handleNext}
      />
    </div>
  );
}