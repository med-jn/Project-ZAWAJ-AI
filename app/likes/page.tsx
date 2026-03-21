'use client';
// 📁 app/likes/page.tsx
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence }     from 'framer-motion';
import { formatDistanceToNow }         from 'date-fns';
import { ar }                          from 'date-fns/locale';
import { supabase }  from '@/lib/supabase/client';
import ChatTab       from '@/components/chat/ChatTab';
import ProfileModal  from '@/components/profile/ProfileModal';

type TabId = 'outgoing' | 'messages' | 'views' | 'incoming';
const TABS: { id: TabId; label: string }[] = [
  { id: 'outgoing', label: 'إعجاباتي' },
  { id: 'messages', label: 'الرسائل'  },
  { id: 'views',    label: 'الزيارات' },
  { id: 'incoming', label: 'المعجبون' },
];

export default function LikesPage() {
  const [tab,       setTab]       = useState<TabId>('outgoing');
  const [userId,    setUserId]    = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, any[]>>({
    outgoing:[], views:[], incoming:[],
  });

  const tabIdx = TABS.findIndex(t => t.id === tab);
  const tx     = useRef(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const cols = 'id, full_name, avatar_url, city, age, is_photos_blurred';
    const go = async () => {
      setLoading(true);
      const [a, b, c] = await Promise.all([
        supabase.from('likes').select(`id,created_at,profile:profiles!to_user(${cols})`).eq('from_user',userId).eq('action','like').order('created_at',{ascending:false}),
        supabase.from('likes').select(`id,created_at,profile:profiles!from_user(${cols})`).eq('to_user',userId).eq('action','view').order('created_at',{ascending:false}),
        supabase.from('likes').select(`id,created_at,profile:profiles!from_user(${cols})`).eq('to_user',userId).eq('action','like').order('created_at',{ascending:false}),
      ]);
      const f = (r: any) =>
        (r.data??[])
          .map((x:any) => ({ id:x.id, created_at:x.created_at, profile:x.profile }))
          .filter((x:any) => x.profile);
      setData({ outgoing:f(a), views:f(b), incoming:f(c) });
      setLoading(false);
    };
    go();
    const ch = supabase.channel('likes_rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'likes'},go)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  // سوايب: يسار→يمين = تبويب تالٍ، يمين→يسار = سابق
  const onTS = (e: React.TouchEvent) => { tx.current = e.touches[0].clientX; };
  const onTE = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - tx.current;
    if (Math.abs(dx) < 55) return;
    if (dx > 0 && tabIdx < TABS.length - 1) setTab(TABS[tabIdx + 1].id);
    if (dx < 0 && tabIdx > 0)              setTab(TABS[tabIdx - 1].id);
  };

  const count = tab !== 'messages' ? (data[tab]?.length ?? 0) : 0;

  return (
    <>
      {/* ══ الشريط الفرعي الثابت ══════════════════════════════
          position: sticky + top = var(--header-h)
          يبقى تحت PageHeader الثابت — المحتوى يتمرر تحته
      ════════════════════════════════════════════════════════ */}
      <div
        dir="rtl"
        style={{
          position:   'sticky',
          top:        'var(--header-h)',
          zIndex:     900,
          background: 'var(--bg-main)',
          borderBottom: '1px solid var(--glass-border)',
          padding: 'var(--sp-3) var(--sp-4) var(--sp-2)',
        }}
      >
        {/* اسم التبويب الحالي + العدد */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity:0, y:-4 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:4 }}
            transition={{ duration: 0.13 }}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--sp-2)',
              marginBottom: 'var(--sp-2)',
            }}
          >
            <span style={{
              fontSize:   'var(--text-xl)',
              fontWeight: 900,
              color:      'var(--text-main)',
            }}>
              {TABS[tabIdx].label}
            </span>
            {count > 0 && (
              <span style={{
                fontSize:   'var(--text-sm)',
                fontWeight: 700,
                color:      'var(--color-primary)',
              }}>
                {count}
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* الشريط الرباعي الملوّن */}
        <div style={{ display:'flex', gap: 5 }}>
          {TABS.map((t, i) => (
            <motion.div
              key={t.id}
              onClick={() => setTab(t.id)}
              animate={{
                background: i === tabIdx
                  ? 'var(--color-primary)'
                  : 'rgba(255,255,255,0.12)',
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

      {/* ══ المحتوى ══════════════════════════════════════════ */}
      <div
        dir="rtl"
        style={{ minHeight: '60vh', paddingBottom: 'var(--sp-8)' }}
        onTouchStart={onTS}
        onTouchEnd={onTE}
      >
        <AnimatePresence mode="wait">
          {tab === 'messages' ? (
            <motion.div
              key="msg"
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
            >
              {userId
                ? <ChatTab currentUserId={userId} />
                : <div style={{ textAlign:'center', padding:'var(--sp-12)', color:'var(--text-tertiary)' }}>جارٍ التحميل...</div>
              }
            </motion.div>
          ) : (
            <motion.div
              key={tab}
              initial={{ opacity:0, x:20 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }}
              transition={{ duration: 0.15 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 'var(--sp-3)',
                padding: 'var(--sp-3) var(--sp-3) 0',
              }}
            >
              {loading ? (
                <div style={{ gridColumn:'span 2', textAlign:'center', padding:'var(--sp-12)', color:'var(--text-tertiary)' }}>
                  جارٍ التحميل...
                </div>
              ) : !data[tab]?.length ? (
                <div style={{ gridColumn:'span 2', textAlign:'center', padding:'var(--sp-16)', color:'rgba(255,255,255,0.25)' }}>
                  لا يوجد شيء هنا
                </div>
              ) : (
                data[tab].map((row, i) => (
                  <Card key={row.id} row={row} i={i} onOpen={setProfileId} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {profileId && (
          <ProfileModal
            userId={profileId}
            currentUser={userId ? { id:userId } : null}
            onClose={() => setProfileId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── بطاقة ────────────────────────────────────────────────────
function Card({ row, i, onOpen }: { row:any; i:number; onOpen:(id:string)=>void }) {
  const p = row.profile;
  const b = !!p.is_photos_blurred;

  return (
    <motion.div
      initial={{ opacity:0, y:12 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: i * 0.04 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onOpen(p.id)}
      style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: '3/4.2',
        background: 'var(--bg-surface)',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-soft)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <img
        src={p.avatar_url || '/default-avatar.png'}
        alt=""
        loading="lazy"
        style={{
          width:'100%', height:'100%',
          objectFit:'cover', display:'block',
          filter:    b ? 'blur(22px)' : 'none',
          transform: b ? 'scale(1.12)' : 'none',
        }}
      />

      {/* وقت */}
      <div style={{
        position:'absolute', top: 'var(--sp-2)', right: 'var(--sp-2)',
        background:'rgba(0,0,0,0.55)',
        backdropFilter:'blur(4px)',
        color:'rgba(255,255,255,0.85)',
        fontSize: 'var(--text-2xs)',
        padding: 'var(--sp-1) var(--sp-2)',
        borderRadius: 'var(--radius-full)',
      }}>
        {formatDistanceToNow(new Date(row.created_at), { addSuffix:true, locale:ar })}
      </div>

      {/* معلومات */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        padding: 'var(--sp-6) var(--sp-3) var(--sp-3)',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.92))',
        textAlign: 'right',
      }}>
        <div style={{
          color:'#fff', fontWeight:700,
          fontSize: 'var(--text-sm)',
          marginBottom: 'var(--sp-1)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {p.full_name}
        </div>
        <div style={{
          display:'flex', alignItems:'center', gap: 'var(--sp-1)',
          justifyContent:'flex-end',
          color:'rgba(255,255,255,0.65)',
          fontSize: 'var(--text-2xs)',
        }}>
          {p.age  && <span>{p.age} سنة</span>}
          {p.city && (
            <>
              <span style={{ color:'var(--color-primary)', fontSize:8 }}>●</span>
              <span>{p.city}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}