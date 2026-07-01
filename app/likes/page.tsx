'use client';
/**
 * 📁 app/likes/page.tsx — ZAWAJ AI v2
 * ✅ استثناء المحظورين من كل التبويبات
 * ✅ is_photos_blurred: صورة صاحبها مُضبَّبة عند الجميع
 * ✅ show_photos: إذا المشاهِد اختار FALSE تُضبَّب كل الصور
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter }               from 'next/navigation';
import { formatDistanceToNow }     from 'date-fns';
import { ar }                      from 'date-fns/locale';
import { Heart, MessageCircle, Eye, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import ChatTab      from '@/components/chat/ChatTab';

type TabId = 'outgoing' | 'messages' | 'views' | 'incoming';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'outgoing',  label: 'إعجاباتي', icon: <Heart         size={14} /> },
  { id: 'messages',  label: 'الرسائل',  icon: <MessageCircle size={14} /> },
  { id: 'views',     label: 'الزيارات', icon: <Eye           size={14} /> },
  { id: 'incoming',  label: 'المعجبون', icon: <Users         size={14} /> },
];

const TAB_KEY = 'zawaj_likes_tab';
function getSavedTab(): TabId {
  try {
    const v = sessionStorage.getItem(TAB_KEY);
    if (v && TABS.some(t => t.id === v)) return v as TabId;
  } catch {}
  return 'outgoing';
}
function saveTab(tab: TabId) {
  try { sessionStorage.setItem(TAB_KEY, tab); } catch {}
}

const COLS = 'id, full_name, avatar_url, city, age, is_photos_blurred';

type LikeRow = {
  id: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    city: string | null;
    age: number | null;
    is_photos_blurred: boolean;
  };
};

type DataState = Record<'outgoing' | 'views' | 'incoming', LikeRow[]>;

export default function LikesPage() {
  const router = useRouter();
  const [tab,       setTabRaw] = useState<TabId>(getSavedTab);
  const [userId,    setUserId] = useState<string | null>(null);
  const [showPhotos,setShowPhotos] = useState<boolean>(true); // show_photos الخاص بالمستخدم الحالي
  const [blockedIds,setBlockedIds] = useState<Set<string>>(new Set());
  const [loading,   setLoading]   = useState(false);
  const [data,      setData]      = useState<DataState>({ outgoing: [], views: [], incoming: [] });

  const tabIdx = TABS.findIndex(t => t.id === tab);
  const swipeX = useRef(0);

  const setTab = useCallback((t: TabId) => { setTabRaw(t); saveTab(t); }, []);

  // ── جلب بيانات المستخدم الحالي (show_photos + blocked) ──
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      // جلب show_photos
      const { data: profile } = await supabase
        .from('profiles')
        .select('show_photos')
        .eq('id', user.id)
        .single();
      if (profile) setShowPhotos(profile.show_photos ?? true);

      // جلب IDs المحظورين في الاتجاهين
      const [blocksOut, blocksIn] = await Promise.all([
        supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id),
        supabase.from('blocks').select('blocker_id').eq('blocked_id', user.id),
      ]);
      const ids = new Set<string>();
      (blocksOut.data ?? []).forEach((r: any) => ids.add(r.blocked_id));
      (blocksIn.data  ?? []).forEach((r: any) => ids.add(r.blocker_id));
      setBlockedIds(ids);
    });
  }, []);

  // ── جلب البيانات ─────────────────────────────────────────
  const fetchAll = useCallback(async (uid: string) => {
    setLoading(true);
    const [a, b, c] = await Promise.all([
      // إعجاباتي (outgoing likes)
      supabase.from('likes')
        .select(`id, created_at, profile:profiles!to_user(${COLS})`)
        .eq('from_user', uid).eq('action', 'like')
        .order('created_at', { ascending: false }),

      // الزيارات (views لملفي)
      supabase.from('likes')
        .select(`id, created_at, profile:profiles!from_user(${COLS})`)
        .eq('to_user', uid).eq('action', 'view').neq('from_user', uid)
        .order('created_at', { ascending: false }),

      // المعجبون (incoming likes)
      supabase.from('likes')
        .select(`id, created_at, profile:profiles!from_user(${COLS})`)
        .eq('to_user', uid).eq('action', 'like')
        .order('created_at', { ascending: false }),
    ]);

    const clean = (r: any) =>
      (r.data ?? [])
        .map((x: any) => ({ id: x.id, created_at: x.created_at, profile: x.profile }))
        .filter((x: any) => x.profile);

    setData({
      outgoing: clean(a),
      views:    clean(b),
      incoming: clean(c),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchAll(userId);
    const ch = supabase.channel('likes_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' },
        () => fetchAll(userId))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, fetchAll]);

  // ── فلترة المحظورين ───────────────────────────────────────
  const filterBlocked = useCallback((rows: LikeRow[]) =>
    rows.filter(r => !blockedIds.has(r.profile.id)),
  [blockedIds]);

  // ── السحب للتنقل بين التبويبات ───────────────────────────
  const onTouchStart = (e: React.TouchEvent) => { swipeX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - swipeX.current;
    if (Math.abs(dx) < 55) return;
    if (dx > 0 && tabIdx < TABS.length - 1) setTab(TABS[tabIdx + 1].id);
    if (dx < 0 && tabIdx > 0)               setTab(TABS[tabIdx - 1].id);
  };

  // ── حساب التضبيب لكل بطاقة ───────────────────────────────
  /**
   * الصورة تُضبَّب إذا:
   * - صاحبها اختار is_photos_blurred = true  (خيار صاحب الصورة)
   * - المشاهِد اختار show_photos = false      (خيار المشاهِد)
   */
  const shouldBlur = useCallback((profile: LikeRow['profile']): boolean => {
    return profile.is_photos_blurred || !showPhotos;
  }, [showPhotos]);

  const currentTabData = tab !== 'messages'
    ? filterBlocked(data[tab as keyof DataState] ?? [])
    : [];

  const count = tab !== 'messages' ? currentTabData.length : 0;

  return (
    <>
      {/* ══ الشريط الثابت ══════════════════════════════════════ */}
      <div dir="rtl" style={{
        position: 'sticky', top: 'var(--header-h-safe)', zIndex: 900,
        background: 'var(--bg-main)',
        borderBottom: '1px solid var(--glass-border)',
        padding: 'var(--sp-3) var(--sp-4) var(--sp-2)',
      }}>

        {/* اسم التبويب + العدد */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.13 }}
            style={{
              display: 'flex', alignItems: 'baseline',
              gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)',
            }}
          >
            <span style={{
              fontSize: 'var(--text-xl)', fontWeight: 900,
              color: 'var(--text-main)',
            }}>
              {TABS[tabIdx].label}
            </span>
            {count > 0 && (
              <span style={{
                fontSize: 'var(--text-sm)', fontWeight: 700,
                color: 'var(--color-primary)',
              }}>
                {count}
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* أشرطة التبويب */}
        <div style={{ display: 'flex', gap: 5 }}>
          {TABS.map((t, i) => (
            <motion.div
              key={t.id}
              onClick={() => setTab(t.id)}
              animate={{
                background: i === tabIdx
                  ? 'var(--color-primary)'
                  : 'var(--glass-border)',
              }}
              transition={{ duration: 0.2 }}
              style={{
                flex: 1, height: 4,
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>

      {/* ══ المحتوى ════════════════════════════════════════════ */}
      <div
        dir="rtl"
        style={{ minHeight: '60vh', paddingBottom: 'var(--nav-h-safe)' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          {tab === 'messages' ? (
            <motion.div key="msg"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            >
              {userId
                ? <ChatTab currentUserId={userId} />
                : <Empty text="جارٍ التحميل..." />
              }
            </motion.div>
          ) : (
            <motion.div key={tab}
              initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.16 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 'var(--sp-3)',
                padding: 'var(--sp-3)',
              }}
            >
              {loading ? (
                <>
                  {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                </>
              ) : !currentTabData.length ? (
                <Empty
                  text={
                    tab === 'outgoing' ? 'لم تُرسل أي إعجاب بعد'
                    : tab === 'views'   ? 'لم يزر ملفك أحد بعد'
                    : 'لم يُعجب بك أحد بعد'
                  }
                  span={2}
                />
              ) : (
                currentTabData.map((row, i) => (
                  <LikeCard
                    key={row.id}
                    row={row}
                    index={i}
                    blurred={shouldBlur(row.profile)}
                    onOpen={id => router.push(`/view?id=${id}`)}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ── بطاقة الإعجاب ────────────────────────────────────────────
function LikeCard({
  row, index, blurred, onOpen,
}: {
  row:    LikeRow;
  index:  number;
  blurred: boolean;
  onOpen: (id: string) => void;
}) {
  const p = row.profile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 340, damping: 28 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onOpen(p.id)}
      style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: '3/4.2',
        background: 'var(--glass-bg)',
        cursor: 'pointer',
        border: '1px solid var(--glass-border)',
      }}
    >
      {/* الصورة */}
      <img
        src={p.avatar_url || '/default-avatar.png'}
        alt={p.full_name}
        loading="lazy"
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
          // ✅ التضبيب يأتي من shouldBlur الذي يجمع العمودين
          filter:    blurred ? 'blur(22px)' : 'none',
          transform: blurred ? 'scale(1.12)' : 'none',
          transition: 'filter 0.3s ease',
        }}
      />

      {/* الوقت */}
      <div style={{
        position: 'absolute', top: 'var(--sp-2)', right: 'var(--sp-2)',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        color: 'rgba(255,255,255,0.85)',
        fontSize: 'var(--text-2xs)',
        padding: '3px 8px',
        borderRadius: 'var(--radius-full)',
      }}>
        {formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: ar })}
      </div>

      {/* الاسم والمعلومات */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 'var(--sp-8) var(--sp-3) var(--sp-3)',
        background: 'linear-gradient(to top, var(--bg-main) 0%, transparent 100%)',
        textAlign: 'right',
      }}>
        <div style={{
          color: 'var(--text-main)', fontWeight: 700,
          fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-1)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {p.full_name}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
          justifyContent: 'flex-end',
          color: 'var(--text-tertiary)', fontSize: 'var(--text-2xs)',
        }}>
          {p.age  && <span>{p.age} سنة</span>}
          {p.city && (
            <>
              <span style={{ color: 'var(--color-primary)', fontSize: 8 }}>●</span>
              <span>{p.city}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 'var(--radius-xl)',
      aspectRatio: '3/4.2',
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      overflow: 'hidden',
      animation: 'zawaj-pulse 1.4s ease-in-out infinite',
    }}>
      <style>{`@keyframes zawaj-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────
function Empty({ text, span }: { text: string; span?: number }) {
  return (
    <div style={{
      gridColumn: span ? `span ${span}` : undefined,
      textAlign: 'center',
      padding: 'var(--sp-16)',
      color: 'var(--text-tertiary)',
      fontSize: 'var(--text-sm)',
    }}>
      {text}
    </div>
  );
}