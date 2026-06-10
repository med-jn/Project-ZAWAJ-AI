'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/lib/supabase/client';

interface Recipient {
  id: string;
  name: string;
  avatar: string;
  role: string;
  gender?: string;
  last_seen?: string;
  is_photos_blurred?: boolean;
}

interface ConvItem {
  id: string;
  recipient: Recipient;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

export default function ChatTab({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [convs,   setConvs]   = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConvs = async () => {
    if (!currentUserId) return;

    // ✅ جلب قائمة المحظورين (في الاتجاهين)
    const { data: blocksData } = await supabase
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`);

    const blockedIds = new Set(
      (blocksData ?? []).map(b =>
        b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id
      )
    );

    const { data: convData, error } = await supabase
      .from('conversations')
      .select('id, user_1, user_2, last_message, last_message_time, created_at')
      .or(`user_1.eq.${currentUserId},user_2.eq.${currentUserId}`)
      .order('last_message_time', { ascending: false });

    if (error || !convData?.length) {
      setConvs([]);
      setLoading(false);
      return;
    }

    // ✅ فلترة المحادثات مع المحظورين
    const filteredConvs = convData.filter(c => {
      const otherId = c.user_1 === currentUserId ? c.user_2 : c.user_1;
      return !blockedIds.has(otherId);
    });

    if (!filteredConvs.length) {
      setConvs([]);
      setLoading(false);
      return;
    }

    const otherIds = [...new Set(
      filteredConvs.map(c => c.user_1 === currentUserId ? c.user_2 : c.user_1)
    )];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, gender, last_active_at, is_photos_blurred')
      .in('id', otherIds);

    const profileMap: Record<string, any> = {};
    (profiles ?? []).forEach(p => { profileMap[p.id] = p; });

    // ✅ عداد الرسائل غير المقروءة
    const unreadCounts = await Promise.all(
      filteredConvs.map(c =>
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .eq('is_read', false)
          .neq('sender_id', currentUserId)
          .then(({ count }) => ({ id: c.id, count: count ?? 0 }))
      )
    );

    const unreadMap = Object.fromEntries(unreadCounts.map(x => [x.id, x.count]));

    setConvs(
      filteredConvs.map(c => {
        const otherId = c.user_1 === currentUserId ? c.user_2 : c.user_1;
        const p = profileMap[otherId] ?? {};
        return {
          id: c.id,
          recipient: {
            id:                otherId,
            name:              p.full_name ?? 'مستخدم',
            avatar:            p.avatar_url ?? '',
            role:              p.role ?? 'user',
            gender:            p.gender,
            last_seen:         p.last_active_at,
            is_photos_blurred: p.is_photos_blurred ?? false,
          },
          lastMessage: c.last_message || 'ابدأ المحادثة...',
          time:        c.last_message_time || c.created_at,
          unreadCount: unreadMap[c.id] ?? 0,
        };
      })
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchConvs();

    // ✅ realtime: تحديث القائمة عند أي تغيير في الرسائل أو المحادثات أو الحظر
    const channel = supabase
      .channel('chat-list-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        fetchConvs
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        fetchConvs
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'blocks' },
        fetchConvs // ✅ تحديث فوري عند الحظر
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
        جارٍ التحميل...
      </div>
    );
  }

  if (!convs.length) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
        لا توجد محادثات بعد
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {convs.map(conv => (
        <motion.div
          key={conv.id}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/chat?id=${conv.id}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            borderBottom: '1px solid var(--glass-border)',
            cursor: 'pointer',
          }}
        >
          {/* الأفاتار */}
          <div style={{
            width: 58, height: 58, borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
            border: '1px solid var(--glass-border)',
            position: 'relative',
          }}>
            <img
              src={conv.recipient.avatar || '/default-avatar.png'}
              alt=""
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                filter:    conv.recipient.is_photos_blurred ? 'blur(8px)'   : 'none',
                transform: conv.recipient.is_photos_blurred ? 'scale(1.15)' : 'none',
              }}
            />
          </div>

          {/* المحتوى */}
          <div dir="rtl" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 14 }}>
                {conv.recipient.name}
              </span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 11, flexShrink: 0 }}>
                {formatDistanceToNow(new Date(conv.time), { addSuffix: true, locale: ar })}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <p style={{
                margin: 0, color: 'var(--text-secondary)', fontSize: 13,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
              }}>
                {conv.lastMessage}
              </p>

              {/* ✅ عداد الرسائل غير المقروءة */}
              {conv.unreadCount > 0 && (
                <div style={{
                  minWidth: 20, height: 20, borderRadius: 999,
                  background: 'var(--color-accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, padding: '0 6px', flexShrink: 0,
                }}>
                  {conv.unreadCount}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}