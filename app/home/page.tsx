'use client';
/**
 * 📁 app/home/page.tsx — ZAWAJ AI v3
 * ✅ نظام الحظر مدمج (جدول blocks في الاتجاهين)
 * ✅ like يُستثنى نهائياً | pass يعود في الدورة التالية
 * ✅ حلقة لا نهائية: بعد آخر بطاقة يبدأ من جديد (cycle++)
 * ✅ حفظ الموضع في localStorage (فوري) + Supabase (احتياطي)
 * ✅ استعادة الموضع عند فتح التطبيق بعد الإغلاق
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

// ══════════════════════════════════════════════════════════════
// ── ثوابت مفاتيح التخزين ──────────────────────────────────
// ══════════════════════════════════════════════════════════════
const LS_INDEX_KEY  = (uid: string) => `zawaj_idx_${uid}`;   // الموضع الحالي
const LS_CYCLE_KEY  = (uid: string) => `zawaj_cycle_${uid}`; // رقم الدورة
const LS_QUEUE_KEY  = (uid: string) => `zawaj_queue_${uid}`; // قائمة البطاقات
const QUEUE_TTL     = 2 * 60 * 60 * 1000; // ساعتان قبل تجديد الكاش

// ── مفتاح Supabase (عمود في profiles) لحفظ الموضع احتياطياً ──
// سنحفظ JSON خفيف في حقل ai_feedback مؤقتاً أو يمكن إنشاء جدول مخصص.
// الأفضل: عمود منفصل — لكن لتجنب migration الآن نستخدم localStorage أساساً
// وSupa فقط كـ backup عبر دالة مخصصة.
const SUPABASE_POS_TABLE = 'profiles'; // نحفظ في عمود discovery_position (JSONB)
// إذا لم يكن العمود موجوداً سيُهمل بصمت

// ══════════════════════════════════════════════════════════════
// ── helpers: localStorage ────────────────────────────────────
// ══════════════════════════════════════════════════════════════

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── queue cache ───────────────────────────────────────────────
function getCachedQueue(uid: string): any[] | null {
  try {
    const raw = localStorage.getItem(LS_QUEUE_KEY(uid));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > QUEUE_TTL) {
      localStorage.removeItem(LS_QUEUE_KEY(uid));
      return null;
    }
    return data ?? null;
  } catch { return null; }
}

function saveCachedQueue(uid: string, data: any[]) {
  try {
    localStorage.setItem(LS_QUEUE_KEY(uid), JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function clearCachedQueue(uid: string) {
  try { localStorage.removeItem(LS_QUEUE_KEY(uid)); } catch {}
}

// ══════════════════════════════════════════════════════════════
// ── helpers: Supabase position backup ────────────────────────
// ══════════════════════════════════════════════════════════════

async function savePositionToSupabase(uid: string, index: number, cycle: number) {
  try {
    await supabase
      .from(SUPABASE_POS_TABLE)
      .update({ discovery_position: { index, cycle, ts: Date.now() } } as any)
      .eq('id', uid);
  } catch { /* عمود غير موجود بعد — يُهمل بصمت */ }
}

async function loadPositionFromSupabase(uid: string): Promise<{ index: number; cycle: number } | null> {
  try {
    const { data } = await supabase
      .from(SUPABASE_POS_TABLE)
      .select('discovery_position')
      .eq('id', uid)
      .single();
    if (!data?.discovery_position) return null;
    const pos = data.discovery_position as { index: number; cycle: number; ts: number };
    // تجاهل إذا أقدم من 7 أيام
    if (Date.now() - (pos.ts ?? 0) > 7 * 24 * 60 * 60 * 1000) return null;
    return { index: pos.index ?? 0, cycle: pos.cycle ?? 0 };
  } catch { return null; }
}

// حفظ position بـ debounce (لا نكتب لـ Supabase في كل سوايب)
let _savePosTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSavePosition(uid: string, index: number, cycle: number) {
  if (_savePosTimer) clearTimeout(_savePosTimer);
  _savePosTimer = setTimeout(() => savePositionToSupabase(uid, index, cycle), 4000);
}

// ══════════════════════════════════════════════════════════════
// ── الصفحة الرئيسية ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export default function HomePage() {
  const router = useRouter();

  const [users,        setUsers]        = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycle,        setCycle]        = useState(0);   // رقم الدورة (للحلقة اللانهائية)
  const [loading,      setLoading]      = useState(true);
  const [currentUser,  setCurrentUser]  = useState<any>(null);
  const [filters,      setFilters]      = useState<DiscoveryFilters>(DEFAULT_FILTERS);

  const uidRef   = useRef<string | null>(null);
  const usersRef = useRef<any[]>([]);   // mirror لـ users لتجنب stale closure

  // sync ref مع state
  useEffect(() => { usersRef.current = users; }, [users]);

  // ══════════════════════════════════════════════════════════
  // ── تحميل البطاقات ───────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  const load = useCallback(async (
    activeFilters: DiscoveryFilters,
    opts: { resetPosition?: boolean } = {}
  ) => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    uidRef.current = user.id;

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    if (!profile) { setLoading(false); return; }
    setCurrentUser(profile);

    // ── استعادة الموضع ──────────────────────────────────────
    let savedIndex = 0;
    let savedCycle = 0;

    if (!opts.resetPosition) {
      // 1. localStorage أولاً (أسرع)
      const lsIndex = lsGet<number>(LS_INDEX_KEY(user.id), -1);
      const lsCycle = lsGet<number>(LS_CYCLE_KEY(user.id), 0);

      if (lsIndex >= 0) {
        savedIndex = lsIndex;
        savedCycle = lsCycle;
      } else {
        // 2. Supabase احتياطياً
        const supaPos = await loadPositionFromSupabase(user.id);
        if (supaPos) {
          savedIndex = supaPos.index;
          savedCycle = supaPos.cycle;
          // نسخ للـ localStorage
          lsSet(LS_INDEX_KEY(user.id), savedIndex);
          lsSet(LS_CYCLE_KEY(user.id), savedCycle);
        }
      }
    }

    // ── محاولة كاش ──────────────────────────────────────────
    const cached = getCachedQueue(user.id);
    if (cached && cached.length > 0 && !opts.resetPosition) {
      setUsers(cached);
      setCurrentIndex(savedIndex < cached.length ? savedIndex : 0);
      setCycle(savedCycle);
      setLoading(false);
      // تجديد خلفي صامت
      fetchFresh(user.id, profile, activeFilters, true, savedIndex, savedCycle);
      return;
    }

    await fetchFresh(user.id, profile, activeFilters, false, savedIndex, savedCycle);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════
  // ── جلب بيانات جديدة ─────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  const fetchFresh = async (
    uid: string,
    profile: any,
    activeFilters: DiscoveryFilters,
    silent: boolean,
    restoreIndex: number = 0,
    restoreCycle: number = 0,
  ) => {
    /**
     * في الدورة اللانهائية لا نمرر excludeIds لـ MatchingEngine
     * لأننا نريد رؤية من مررناهم (pass) مجدداً.
     * MatchingEngine يستثني تلقائياً: المحظورين + المُعجَب بهم (like).
     */
    const { data: smartUsers } = await MatchingEngine.getSmartSuggestions(
      profile,
      { ...activeFilters }
    );

    if (!smartUsers?.length) {
      if (!silent) { setUsers([]); setLoading(false); }
      return;
    }

    saveCachedQueue(uid, smartUsers);

    if (!silent) {
      setUsers(smartUsers);
      // استعادة الموضع (تأكد أنه ضمن الحدود)
      const safeIndex = restoreIndex < smartUsers.length ? restoreIndex : 0;
      setCurrentIndex(safeIndex);
      setCycle(restoreCycle);
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
      load(f, { resetPosition: true });
    };
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [load]);

  // ══════════════════════════════════════════════════════════
  // ── التقدم للبطاقة التالية (الحلقة اللانهائية) ───────────
  // ══════════════════════════════════════════════════════════
  const handleNext = useCallback(() => {
    if (!currentUser || !uidRef.current) return;

    setCurrentIndex(prevIdx => {
      const total     = usersRef.current.length;
      const nextIdx   = prevIdx + 1;
      let finalIdx    = nextIdx;
      let finalCycle  = cycle;

      // ── انتهت الدورة → ابدأ من الصفر ──
      if (nextIdx >= total) {
        finalIdx   = 0;
        finalCycle = cycle + 1;
        setCycle(finalCycle);

        // تجديد القائمة في الخلفية (بصمت) لاصطياد أعضاء جدد
        if (uidRef.current && currentUser) {
          const activeFilters = loadFilters();
          fetchFresh(uidRef.current, currentUser, activeFilters, true, 0, finalCycle);
        }
      }

      // ── حفظ الموضع ────────────────────────────────────────
      lsSet(LS_INDEX_KEY(uidRef.current!), finalIdx);
      lsSet(LS_CYCLE_KEY(uidRef.current!), finalCycle);
      scheduleSavePosition(uidRef.current!, finalIdx, finalCycle);

      return finalIdx;
    });
  }, [currentUser, cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = filtersAreActive(filters);

  // ── حالة التحميل ────────────────────────────────────────
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

  // ── لا نتائج بالمرة (قاعدة فارغة) ─────────────────────
  if (users.length === 0) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 'var(--sp-5)', padding: '0 var(--sp-8)',
        background: 'var(--bg-main)',
        direction: 'rtl',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SlidersHorizontal size={28} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
        </div>

        <p style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'var(--text-xl)', textAlign: 'center', margin: 0 }}>
          لا توجد نتائج
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', margin: 0 }}>
          {active ? 'جرّب توسيع نطاق الفلاتر' : 'عد لاحقاً لاكتشاف ملفات جديدة'}
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

  // ── في الحلقة اللانهائية لن يصل currentIndex >= users.length أبداً ──
  // لكن كحماية إضافية:
  const safeIndex = currentIndex % users.length;
  const c = users[safeIndex];

  return (
    <div style={{ position: 'fixed', inset: 0 }}>

      {/* ── زر الفلاتر ─────────────────────────────────────── */}
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

      {/* ── مؤشر الدورة (اختياري — يُظهر للمستخدم أنه في جولة جديدة) ── */}
      {cycle > 0 && (
        <div style={{
          position: 'fixed',
          top: 'calc(var(--header-h, 0px) + var(--sp-3))',
          right: 'var(--sp-4)',
          zIndex: 200,
          padding: 'var(--sp-1) var(--sp-3)',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(0,0,0,0.28)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(14px)',
          color: 'rgba(255,255,255,0.45)',
          fontSize: 'var(--text-xs)', fontWeight: 600,
          direction: 'rtl',
        }}>
          جولة {cycle + 1}
        </div>
      )}

      {/* ── البطاقة ──────────────────────────────────────────── */}
      <UserCard
        key={`${c.id}-${cycle}`}   // key يتغير مع الدورة أيضاً لإعادة البناء الصحيحة
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