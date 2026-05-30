'use client';
/**
 * 📁 app/likes/page.tsx — ZAWAJ AI
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter }               from 'next/navigation';
import { formatDistanceToNow }     from 'date-fns';
import { ar }                      from 'date-fns/locale';
import { Heart, MessageCircle, Eye, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import ChatTab      from '@/components/chat/ChatTab';

// ── التبويبات ─────────────────────────────────────────────────
type TabId = 'outgoing' | 'messages' | 'views' | 'incoming';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'outgoing',  label: 'إعجاباتي', icon: <Heart         size={15} /> },
  { id: 'messages',  label: 'الرسائل',  icon: <MessageCircle size={15} /> },
  { id: 'views',     label: 'الزيارات', icon: <Eye           size={15} /> },
  { id: 'incoming',  label: 'المعجبون', icon: <Users         size={15} /> },
];

// حفظ التبويب في sessionStorage
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

// ─────────────────────────────────────────────────────────────
const COLS = 'id, full_name, avatar_url, city, age, is_photos_blurred';

type LikeRow = {
  id: string;
  created_at: string;
  profile: {
    id: string; full_name: string; avatar_url: string | null;
    city: string | null; age: number | null; is_photos_blurred: boolean;
  };
};
type DataState = Record<'outgoing' | 'views' | 'incoming', LikeRow[]>;

// ─────────────────────────────────────────────────────────────
export default function LikesPage() {
  const router = useRouter();

  const [tab,    setTabRaw] = useState<TabId>(getSavedTab);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading,setLoading]= useState(false);
  const [data,   setData]   = useState<DataState>({ outgoing: [], views: [], incoming: [] });

  const tabIdx = TABS.findIndex(t => t.id === tab);
  const swipeX = useRef(0);

  const setTab = useCallback((t: TabId) => {
    setTabRaw(t);
    saveTab(t);
  }, []);

  // جلب المستخدم
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // جلب البيانات
  const fetchAll = useCallback(async (uid: string) => {
    setLoading(true);
    const [a, b, c] = await Promise.all([
      supabase.from('likes')
        .select(`id, created_at, profile:profiles!to_user(${COLS})`)
        .eq('from_user', uid).eq('action', 'like')
        .order('created_at', { ascending: false }),
      supabase.from('likes')
        .select(`id, created_at, profile:profiles!from_user(${COLS})`)
        .eq('to_user', uid).eq('action', 'view')
        .neq('from_user', uid)
        .order('created_at', { ascending: false }),
      supabase.from('likes')
        .select(`id, created_at, profile:profiles!from_user(${COLS})`)
        .eq('to_user', uid).eq('action', 'like')
        .order('created_at', { ascending: false }),
    ]);
    const clean = (r: any) =>
      (r.data ?? [])
        .map((x: any) => ({ id: x.id, created_at: x.created_at, profile: x.profile }))
        .filter((x: any) => x.profile);
    setData({ outgoing: clean(a), views: clean(b), incoming: clean(c) });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchAll(userId);
    const ch = supabase.channel('likes_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => fetchAll(userId))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, fetchAll]);

  // ── سوايب أفقي — RTL: يمين→يسار = تبويب سابق (فهرس أقل) ──
  // في RTL: السحب لليمين (dx > 0) = الذهاب للتبويب الأيمن = فهرس أقل
  //         السحب لليسار (dx < 0) = الذهاب للتبويب الأيسر = فهرس أعلى
  const onTouchStart = (e: React.TouchEvent) => { swipeX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - swipeX.current;
    if (Math.abs(dx) < 55) return;
    if (dx > 0 && tabIdx > 0)              setTab(TABS[tabIdx - 1].id); // يمين → تبويب سابق (RTL)
    if (dx < 0 && tabIdx < TABS.length - 1) setTab(TABS[tabIdx + 1].id); // يسار → تبويب تالٍ
  };

  const count = tab !== 'messages' ? (data[tab as keyof DataState]?.length ?? 0) : 0;

  return (
    <>
      {/* ══ شريط التبويبات الثابت ══════════════════════════════ */}
      <div dir="rtl" style={{
        position: 'sticky', top: 'var(--header-h)', zIndex: 900,
        background: 'var(--bg-main)',
        borderBottom: '1px solid var(--glass-border)',
        padding: 'var(--sp-3) var(--sp-4) 0',
      }}>

        {/* اسم التبويب + العدد */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.13 }}
            style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}
          >
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--text-main)' }}>
              {TABS[tabIdx].label}
            </span>
            {count > 0 && (
              <span style={{
                fontSize: 'var(--text-xs)', fontWeight: 800,
                color: 'var(--color-primary)',
                background: 'var(--color-primary-xsoft)',
                padding: '1px 8px', borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-primary-soft)',
              }}>
                {count}
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── الشريط الرقيق مقسّم على 4 — كما في الأصل ── */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, background: 'none', border: 'none',
                padding: '0 0 var(--sp-2)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4,
                color: i === tabIdx ? 'var(--color-primary)' : 'var(--text-tertiary)',
                transition: 'color 0.18s',
                fontFamily: 'inherit',
              }}
            >
              {/* الأيقونة */}
              <span style={{ opacity: i === tabIdx ? 1 : 0.45, display: 'flex' }}>
                {t.icon}
              </span>
              {/* النص */}
              <span style={{
                fontSize: 'var(--text-2xs)', fontWeight: i === tabIdx ? 800 : 500,
                letterSpacing: '0.02em', whiteSpace: 'nowrap',
              }}>
                {t.label}
              </span>
              {/* الشريط الرقيق السفلي — يتلون فقط للتبويب النشط */}
              <motion.div
                animate={{ background: i === tabIdx ? 'var(--color-primary)' : 'var(--glass-border)' }}
                transition={{ duration: 0.2 }}
                style={{ height: 3, width: '100%', borderRadius: '3px 3px 0 0' }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ══ المحتوى ════════════════════════════════════════════ */}
      <div
        dir="rtl"
        style={{ minHeight: '60vh', paddingBottom: 'var(--nav-h)' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">

          {/* تبويب الرسائل — ChatTab يفتح /chat?id=... مباشرة */}
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
              initial={{ opacity: 0, x: tab === TABS[tabIdx]?.id ? 0 : 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.17 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--sp-3)',
                padding: 'var(--sp-3)',
              }}
            >
              {loading ? (
                <Empty text="جارٍ التحميل..." span={2} />
              ) : !data[tab as keyof DataState]?.length ? (
                <Empty
                  text={
                    tab === 'outgoing'  ? 'لم تُرسل أي إعجاب بعد'  :
                    tab === 'views'     ? 'لم يزر ملفك أحد بعد'     :
                                         'لم يُعجب بك أحد بعد'
                  }
                  span={2}
                />
              ) : (
                data[tab as keyof DataState].map((row, i) => (
                  <LikeCard
                    key={row.id}
                    row={row}
                    index={i}
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

// ── بطاقة ─────────────────────────────────────────────────────
function LikeCard({ row, index, onOpen }: {
  row: LikeRow; index: number; onOpen: (id: string) => void;
}) {
  const p = row.profile;
  const blurred = !!p.is_photos_blurred;

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
      <img
        src={p.avatar_url || '/default-avatar.png'}
        alt=""
        loading="lazy"
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
          filter:    blurred ? 'blur(22px)' : 'none',
          transform: blurred ? 'scale(1.12)' : 'none',
        }}
      />

      {/* الوقت */}
      <div style={{
        position: 'absolute', top: 'var(--sp-2)', right: 'var(--sp-2)',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        color: 'rgba(255,255,255,0.85)', fontSize: 'var(--text-2xs)',
        padding: '3px 8px', borderRadius: 'var(--radius-full)',
      }}>
        {formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: ar })}
      </div>

      {/* المعلومات — تدرج من var(--bg-main) للايت/دارك */}
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
          justifyContent: 'flex-end', color: 'var(--text-tertiary)',
          fontSize: 'var(--text-2xs)',
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

// ── حالة فارغة ────────────────────────────────────────────────
function Empty({ text, span }: { text: string; span?: number }) {
  return (
    <div style={{
      gridColumn: span ? `span ${span}` : undefined,
      textAlign: 'center', padding: 'var(--sp-16)',
      color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)',
    }}>
      {text}
    </div>
  );
}