'use client';

/**
 * 📁 app/home/page.tsx — ZAWAJ AI v2 (UPDATED)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { MatchingEngine } from '@/lib/services/MatchingEngine';
import UserCard from '@/components/cards/usercard';

import {
  loadFilters,
  filtersAreActive,
  type DiscoveryFilters,
  DEFAULT_FILTERS,
} from '@/app/filter/page';

// ── Cache ─────────────────────────────────────────────
const SEEN_KEY = (uid: string) => `zawaj_seen_${uid}`;
const QUEUE_KEY = (uid: string) => `zawaj_queue_${uid}`;
const SEEN_TTL = 24 * 60 * 60 * 1000;
const QUEUE_TTL = 60 * 60 * 1000;

function getSeenIds(uid: string): string[] {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY(uid));
    if (!raw) return [];
    const arr: { id: string; ts: number }[] = JSON.parse(raw);
    return arr.filter(x => Date.now() - x.ts < SEEN_TTL).map(x => x.id);
  } catch {
    return [];
  }
}

function addSeenId(uid: string, pid: string) {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY(uid));
    const arr: { id: string; ts: number }[] = raw ? JSON.parse(raw) : [];
    const fresh = arr.filter(x => Date.now() - x.ts < SEEN_TTL && x.id !== pid);
    fresh.push({ id: pid, ts: Date.now() });
    sessionStorage.setItem(SEEN_KEY(uid), JSON.stringify(fresh));
  } catch {}
}

function getCachedQueue(uid: string): any[] {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY(uid));
    if (!raw) return [];
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > QUEUE_TTL) {
      sessionStorage.removeItem(QUEUE_KEY(uid));
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

function saveCachedQueue(uid: string, data: any[]) {
  try {
    sessionStorage.setItem(QUEUE_KEY(uid), JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function clearCachedQueue(uid: string) {
  try {
    sessionStorage.removeItem(QUEUE_KEY(uid));
  } catch {}
}

// ──────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);

  const uidRef = useRef<string | null>(null);

  // ── load ─────────────────────────────────────────────
  const load = useCallback(async (activeFilters: DiscoveryFilters) => {
    setLoading(true);
    setCurrentIndex(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    uidRef.current = user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return setLoading(false);

    setCurrentUser(profile);

    const cached = getCachedQueue(user.id);

    if (cached.length) {
      setUsers(cached);
      setLoading(false);
      fetchFresh(user.id, profile, activeFilters, true);
      return;
    }

    await fetchFresh(user.id, profile, activeFilters, false);
  }, []);

  const fetchFresh = async (
    uid: string,
    profile: any,
    activeFilters: DiscoveryFilters,
    silent: boolean
  ) => {

    const result = await MatchingEngine.getSmartSuggestions(
      profile,
      activeFilters
    );

    const smartUsers = result.data ?? [];

    if (!smartUsers.length) {
      if (!silent) setUsers([]);
      if (!silent) setLoading(false);
      return;
    }

    saveCachedQueue(uid, smartUsers);

    if (!silent) {
      setUsers(smartUsers);
      setLoading(false);
    }
  };

  // ── mount ───────────────────────────────────────────
  useEffect(() => {
    const f = loadFilters();
    setFilters(f);
    load(f);
  }, [load]);

  // ── refresh on focus ────────────────────────────────
  useEffect(() => {
    const handler = () => {
      const f = loadFilters();
      setFilters(f);
      if (uidRef.current) clearCachedQueue(uidRef.current);
      load(f);
    };

    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [load]);

  // ── next card ───────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!currentUser) return;

    const current = users[currentIndex];

    if (current) addSeenId(currentUser.id, current.id);

    setCurrentIndex(prev => prev + 1);
  }, [users, currentIndex, currentUser]);

  const active = filtersAreActive(filters);

  // ── loading ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#ff4d6d',
          }}
        />
      </div>
    );
  }

  // ── empty / finished ────────────────────────────────
  if (users.length === 0 || currentIndex >= users.length) {
    const finished = users.length > 0;

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center'
      }}>
        <SlidersHorizontal size={32} opacity={0.6} />

        <h3>
          {finished ? 'شاهدت كل البطاقات المتاحة' : 'لا توجد نتائج'}
        </h3>

        <p style={{ opacity: 0.6 }}>
          {active && !finished ? 'جرّب توسيع الفلاتر' : 'عد لاحقاً'}
        </p>

        {active && (
          <button onClick={() => router.push('/filter')}>
            تعديل الفلاتر
          </button>
        )}
      </div>
    );
  }

  const c = users[currentIndex];

  return (
    <div style={{ position: 'fixed', inset: 0 }}>

      {/* filters */}
      <button onClick={() => router.push('/filter')}>
        {active ? 'فلاتر نشطة' : 'فلاتر'}
      </button>

      {/* card */}
      <UserCard
        key={c.id}
        userData={{
          id: c.id,
          name: c.full_name || '—',
          age: c.age,
          city: c.city,
          gender: c.gender,
          mainPhoto: c.avatar_url || '/default-avatar.png',
          prefersBlur: c.is_photos_blurred,
          currentUser,
        }}
        onNext={handleNext}
      />
    </div>
  );
}