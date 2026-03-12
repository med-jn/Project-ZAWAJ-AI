'use client';
import { useEffect, useState }    from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow }     from 'date-fns';
import { ar }                      from 'date-fns/locale';
import { supabase }   from '@/lib/supabase/client';
import ChatWindow     from '@/components/chat/ChatWindow';
import ProfileModal   from '@/components/profile/ProfileModal';

interface Recipient {
  id: string; name: string; avatar: string;
  role: string; gender?: string;
  last_seen?: string; is_photos_blurred?: boolean;
}
interface ConvItem {
  id: string; recipient: Recipient;
  lastMessage: string; time: string; unreadCount: number;
}

export default function ChatTab({ currentUserId }: { currentUserId: string }) {
  const [convs,      setConvs]      = useState<ConvItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeConv, setActiveConv] = useState<ConvItem | null>(null);
  const [profileId,  setProfileId]  = useState<string | null>(null);

  const fetchConvs = async () => {
    if (!currentUserId) return;
    setLoading(true);

    // جلب المحادثات بدون hint للـ FK — نجلب الـ profiles منفصلاً
    const { data: convData, error } = await supabase
      .from('conversations')
      .select('id, user_1, user_2, last_message, last_message_time, created_at')
      .or(`user_1.eq.${currentUserId},user_2.eq.${currentUserId}`)
      .order('last_message_time', { ascending: false });

    if (error || !convData?.length) { setLoading(false); setConvs([]); return; }

    // جمع IDs الطرف الآخر
    const otherIds = [...new Set(
      convData.map((c: any) => c.user_1 === currentUserId ? c.user_2 : c.user_1)
    )];

    // جلب بروفايلات دفعة واحدة
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, gender, last_active_at, is_photos_blurred')
      .in('id', otherIds);

    const profileMap: Record<string, any> = {};
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

    // عدد الغير مقروء
    const unreadCounts = await Promise.all(
      convData.map((c: any) =>
        supabase.from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .eq('is_read', false)
          .neq('sender_id', currentUserId)
          .then(({ count }) => ({ id: c.id, count: count ?? 0 }))
      )
    );
    const unreadMap = Object.fromEntries(unreadCounts.map(x => [x.id, x.count]));

    setConvs(convData.map((c: any) => {
      const otherId = c.user_1 === currentUserId ? c.user_2 : c.user_1;
      const p = profileMap[otherId] ?? {};
      return {
        id: c.id,
        recipient: {
          id:                otherId,
          name:              p.full_name       ?? '—',
          avatar:            p.avatar_url      ?? '',
          role:              p.role            ?? 'user',
          gender:            p.gender,
          last_seen:         p.last_active_at,
          is_photos_blurred: p.is_photos_blurred ?? false,
        },
        lastMessage: c.last_message || 'ابدأ المحادثة...',
        time:        c.last_message_time || c.created_at,
        unreadCount: unreadMap[c.id] ?? 0,
      };
    }));
    setLoading(false);
  };

  useEffect(() => {
    fetchConvs();
    const ch = supabase.channel('convs_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConvs)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchConvs)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentUserId]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
      جارٍ التحميل...
    </div>
  );
  if (!convs.length) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>
      لا توجد محادثات بعد
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {convs.map(conv => (
          <motion.div key={conv.id} whileTap={{ scale: 0.985 }}
            onClick={() => setActiveConv(conv)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer',
            }}>
            {/* الصورة */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', overflow: 'hidden',
                border: '1.5px solid var(--glass-border)', background: 'var(--bg-surface)',
              }}>
                <img src={conv.recipient.avatar || '/default-avatar.png'} alt="" loading="lazy"
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    filter:    conv.recipient.is_photos_blurred ? 'blur(8px)'   : 'none',
                    transform: conv.recipient.is_photos_blurred ? 'scale(1.15)' : 'none',
                  }} />
              </div>
              {/* نقطة المتصل */}
              {conv.recipient.last_seen && (() => {
                const mins = Math.floor((Date.now() - new Date(conv.recipient.last_seen!).getTime()) / 60000);
                return mins < 5 ? (
                  <div style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 11, height: 11, borderRadius: '50%',
                    background: '#22c55e', border: '2px solid var(--bg-main)',
                  }} />
                ) : null;
              })()}
            </div>

            {/* المحتوى */}
            <div style={{ flex: 1, minWidth: 0 }} dir="rtl">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: conv.unreadCount ? 700 : 600, fontSize: 14 }}>
                    {conv.recipient.name}
                  </span>
                  {conv.recipient.role === 'mediator' && (
                    <span style={{ background: 'linear-gradient(45deg,#d4af37,#f9e29d)', color: '#000', fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>وسيط</span>
                  )}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                  {formatDistanceToNow(new Date(conv.time), { addSuffix: true, locale: ar })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{
                  color: conv.unreadCount ? 'var(--text-secondary)' : 'rgba(255,255,255,0.45)',
                  fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', margin: 0, flex: 1,
                  fontWeight: conv.unreadCount ? 600 : 400,
                }}>
                  {conv.lastMessage}
                </p>
                {conv.unreadCount > 0 && (
                  <span style={{
                    background: 'var(--color-accent)', color: '#fff',
                    fontSize: 10, minWidth: 18, height: 18, borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px', marginRight: 6, fontWeight: 700, flexShrink: 0,
                  }}>
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {activeConv && (
          <ChatWindow
            conversationId={activeConv.id}
            currentUserId={currentUserId}
            recipient={activeConv.recipient}
            onBack={() => setActiveConv(null)}
            onOpenProfile={id => setProfileId(id)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {profileId && (
          <ProfileModal userId={profileId} currentUser={{ id: currentUserId }} onClose={() => setProfileId(null)} />
        )}
      </AnimatePresence>
    </>
  );
}