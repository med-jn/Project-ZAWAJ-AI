'use client';
/**
 * 📁 app/home/page.tsx — ZAWAJ AI v2
 * ✅ لا refresh عند السوايب — index يتقدم داخل المصفوفة
 * ✅ بدون نقاط/شراء/بادجات
 * ✅ فلاتر تفتح /filter كصفحة مستقلة
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion }            from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { useRouter }         from 'next/navigation';
import { supabase }          from '@/lib/supabase/client';
import { MatchingEngine }    from '@/lib/services/MatchingEngine';
import UserCard              from '@/components/cards/usercard';
import {
  loadFilters, filtersAreActive,
  type DiscoveryFilters, DEFAULT_FILTERS,
} from '@/app/filter/page';

// ── Cache helpers (sessionStorage) ───────────────────────────
const SEEN_KEY     = (uid: string) => `zawaj_seen_${uid}`;
const QUEUE_KEY    = (uid: string) => `zawaj_queue_${uid}`;
const SEEN_TTL     = 24 * 60 * 60 * 1000;
const QUEUE_TTL    = 60 * 60 * 1000;

function getSeenIds(uid: string): string[] {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY(uid));
    if (!raw) return [];
    const arr: { id: string; ts: number }[] = JSON.parse(raw);
    return arr.filter(x => Date.now() - x.ts < SEEN_TTL).map(x => x.id);
  } catch { return []; }
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
    if (Date.now() - ts > QUEUE_TTL) { sessionStorage.removeItem(QUEUE_KEY(uid)); return []; }
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

  // نحفظ uid في ref لتجنب re-render loops
  const uidRef = useRef<string | null>(null);

  // ── تحميل البطاقات ─────────────────────────────────────────
  const load = useCallback(async (activeFilters: DiscoveryFilters) => {
    setLoading(true);
    setCurrentIndex(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    uidRef.current = user.id;

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    if (!profile) { setLoading(false); return; }
    setCurrentUser(profile);

    // قراءة الكاش أولاً
    const cached = getCachedQueue(user.id);
    if (cached.length > 0) {
      setUsers(cached);
      setLoading(false);
      // تجديد في الخلفية بصمت
      fetchFresh(user.id, profile, activeFilters, true);
      return;
    }

    await fetchFresh(user.id, profile, activeFilters, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFresh = async (
    uid: string, profile: any,
    activeFilters: DiscoveryFilters,
    silent: boolean,
  ) => {
    const seenIds = getSeenIds(uid);
    const { data: smartUsers } = await MatchingEngine.getSmartSuggestions(
      profile, { ...activeFilters, excludeIds: seenIds }
    );

    if (!smartUsers?.length) {
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

  // ── load عند mount ─────────────────────────────────────────
  useEffect(() => {
    const f = loadFilters();
    setFilters(f);
    load(f);
  }, [load]);

  // ── إعادة load عند العودة من /filter ──────────────────────
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

  // ── التقدم للبطاقة التالية — بلا re-render كامل ───────────
  const handleNext = useCallback(() => {
    if (!currentUser) return;
    const current = users[currentIndex];
    if (current) addSeenId(currentUser.id, current.id);
    // نستخدم functional update لضمان آخر قيمة
    setCurrentIndex(prev => prev + 1);
  }, [users, currentIndex, currentUser]);

  const active = filtersAreActive(filters);

  // ── حالة التحميل ──────────────────────────────────────────
  if (loading) return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--glass-border)',
          borderTopColor: 'var(--color-primary)',
        }}
      />
    </div>
  );

  // ── لا نتائج أو انتهت البطاقات ────────────────────────────
  if (users.length === 0 || currentIndex >= users.length) {
    const finished = users.length > 0;
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 'var(--sp-5)', padding: '0 var(--sp-8)',
        background: 'var(--bg-main)',
        direction: 'rtl',
      }}>
        {/* أيقونة بدل ايموجي */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SlidersHorizontal size={28} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
        </div>

        <p style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'var(--text-xl)', textAlign: 'center', margin: 0 }}>
          {finished ? 'شاهدت كل البطاقات المتاحة' : 'لا توجد نتائج'}
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', margin: 0 }}>
          {active && !finished ? 'جرّب توسيع نطاق الفلاتر' : 'عد لاحقاً لاكتشاف ملفات جديدة'}
        </p>

        {active && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push('/filter')}
            style={{
              padding: 'var(--sp-3) var(--sp-6)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-xsoft)',
              border: '1px solid var(--color-primary-soft)',
              color: 'var(--color-primary)',
              fontWeight: 800, fontSize: 'var(--text-sm)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            تعديل الفلاتر
          </motion.button>
        )}
      </div>
    );
  }

  const c = users[currentIndex];

  return (
    <div style={{ position: 'fixed', inset: 0 }}>

      {/* ── زر الفلاتر ────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => router.push('/filter')}
        style={{
          position: 'fixed',
          top: 'calc(var(--header-h, 0px) + var(--sp-3))',
          left: 'var(--sp-4)',
          zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
          padding: 'var(--sp-2) var(--sp-3)',
          borderRadius: 'var(--radius-lg)',
          background: active
            ? 'rgba(192,0,42,0.18)'
            : 'rgba(0,0,0,0.28)',
          border: `1px solid ${active ? 'rgba(192,0,42,0.4)' : 'rgba(255,255,255,0.12)'}`,
          backdropFilter: 'blur(14px)',
          color: active ? '#ff6680' : 'rgba(255,255,255,0.72)',
          fontSize: 'var(--text-xs)', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: active
            ? '0 4px 16px rgba(192,0,42,0.22)'
            : '0 4px 12px rgba(0,0,0,0.18)',
        }}
      >
        <SlidersHorizontal size={14} />
        {active ? 'فلاتر نشطة' : 'فلاتر'}
        {active && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#ff6680', display: 'inline-block', flexShrink: 0,
          }} />
        )}
      </motion.button>

      {/* ── البطاقة ──────────────────────────────────────── */}
      {/*
        KEY مهم جداً: نعطي UserCard مفتاحاً يتغير مع كل بطاقة
        هذا يجعل React يُعيد بناء المكوّن بالكامل (motionValues جديدة)
        دون أي re-render للصفحة الأم أو رجوع للبطاقة الأولى
      */}
      <UserCard
        key={c.id}
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