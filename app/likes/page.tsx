'use client';
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
  const [data, setData] = useState<Record<string, any[]>>({ outgoing:[], views:[], incoming:[] });

  const tabIdx = TABS.findIndex(t => t.id === tab);
  const tx = useRef(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
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
      const f = (r: any) => (r.data??[]).map((x:any)=>({id:x.id,created_at:x.created_at,profile:x.profile})).filter((x:any)=>x.profile);
      setData({ outgoing:f(a), views:f(b), incoming:f(c) });
      setLoading(false);
    };
    go();
    const ch = supabase.channel('likes_rt').on('postgres_changes',{event:'*',schema:'public',table:'likes'},go).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  // ── السوايب ──────────────────────────────────────────────
  // إصبع يتحرك من اليسار إلى اليمين (dx موجب) = التبويب التالي
  // إصبع يتحرك من اليمين إلى اليسار (dx سالب) = التبويب السابق
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
      <div dir="rtl" style={{ minHeight:'100vh', background:'var(--bg-main)', paddingBottom:90 }}
        onTouchStart={onTS} onTouchEnd={onTE}>

        {/* اسم التبويب + العدد */}
        <div style={{ padding:'24px 20px 0' }}>
          <AnimatePresence mode="wait">
            <motion.h1 key={tab}
              initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:5}}
              transition={{duration:0.13}}
              style={{ color:'var(--text-main)', fontSize:'calc(var(--base-font-size)*1.5)', fontWeight:900, margin:0 }}>
              {TABS[tabIdx].label}
              {count > 0 && (
                <span style={{ color:'var(--color-primary)', fontSize:'calc(var(--base-font-size)*0.85)', fontWeight:700, marginRight:8 }}>
                  {count}
                </span>
              )}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* ── الشريط الرباعي (خطوط فقط) ── */}
        <div style={{ display:'flex', gap:5, padding:'14px 16px 22px' }}>
          {TABS.map((_, i) => (
            <motion.div key={i} onClick={() => setTab(TABS[i].id)}
              animate={{ background: i===tabIdx ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)' }}
              style={{ flex:1, height:4, borderRadius:4, cursor:'pointer' }}
            />
          ))}
        </div>

        {/* المحتوى */}
        <AnimatePresence mode="wait">
          {tab === 'messages' ? (
            <motion.div key="msg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              {userId
                ? <ChatTab currentUserId={userId} />
                : <div style={{textAlign:'center',padding:60,color:'var(--text-tertiary)'}}>جارٍ التحميل...</div>
              }
            </motion.div>
          ) : (
            <motion.div key={tab}
              initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
              transition={{duration:0.15}}
              style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, padding:'0 12px' }}>
              {loading ? (
                <div style={{gridColumn:'span 2',textAlign:'center',padding:60,color:'var(--text-tertiary)'}}>جارٍ التحميل...</div>
              ) : !data[tab]?.length ? (
                <div style={{gridColumn:'span 2',textAlign:'center',padding:80,color:'rgba(255,255,255,0.25)'}}>لا يوجد شيء هنا</div>
              ) : data[tab].map((row,i) => (
                <Card key={row.id} row={row} i={i} onOpen={setProfileId} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {profileId && (
          <ProfileModal userId={profileId} currentUser={userId?{id:userId}:null} onClose={()=>setProfileId(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function Card({ row, i, onOpen }: { row:any; i:number; onOpen:(id:string)=>void }) {
  const p = row.profile;
  const b = !!p.is_photos_blurred;
  return (
    <motion.div
      initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
      whileTap={{scale:0.95}} onClick={()=>onOpen(p.id)}
      style={{
        borderRadius:20, overflow:'hidden', position:'relative',
        aspectRatio:'3/4.2', background:'var(--bg-surface)', cursor:'pointer',
        boxShadow:'0 4px 20px rgba(0,0,0,0.4)', border:'1px solid var(--glass-border)',
      }}>
      {/* الصورة — تُضبَّب فقط إذا is_photos_blurred */}
      <img src={p.avatar_url||'/default-avatar.png'} alt="" loading="lazy"
        style={{
          width:'100%', height:'100%', objectFit:'cover', display:'block',
          filter:    b ? 'blur(22px)' : 'none',
          transform: b ? 'scale(1.12)' : 'none',
        }} />
      {/* وقت */}
      <div style={{
        position:'absolute', top:8, right:8,
        background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)',
        color:'rgba(255,255,255,0.8)', fontSize:10, padding:'2px 8px', borderRadius:10,
      }}>
        {formatDistanceToNow(new Date(row.created_at),{addSuffix:true,locale:ar})}
      </div>
      {/* معلومات — تظهر دائماً بغض النظر عن التضبيب */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        padding:'24px 10px 12px',
        background:'linear-gradient(transparent,rgba(0,0,0,0.92))',
        textAlign:'right',
      }}>
        <div style={{color:'#fff',fontWeight:700,fontSize:13,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {p.full_name}
        </div>
        <div style={{color:'rgba(255,255,255,0.65)',fontSize:11,display:'flex',gap:4,justifyContent:'flex-end'}}>
          {p.age  && <span>{p.age} سنة</span>}
          {p.city && <><span style={{color:'var(--color-primary)',fontSize:8}}>●</span><span>{p.city}</span></>}
        </div>
      </div>
    </motion.div>
  );
}