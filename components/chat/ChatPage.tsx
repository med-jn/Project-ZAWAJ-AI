'use client';
/**
 * 📁 components/chat/ChatPage.tsx — ZAWAJ AI v2
 * ✅ فحص الحظر realtime — يُغلق النافذة فوراً عند الحظر
 */

import ChatWindow    from '@/components/chat/ChatWindow';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase }  from '@/lib/supabase/client';

interface Recipient {
  id:                string;
  name:              string;
  avatar:            string;
  role:              string;
  gender?:           string;
  last_seen?:        string;
  is_photos_blurred?: boolean;
}

export default function ChatPage({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId:  string;
}) {
  const router = useRouter();
  const [recipient,  setRecipient]  = useState<Recipient | null>(null);
  const [isBlocked,  setIsBlocked]  = useState<boolean | null>(null); // null = جاري الفحص

  // ── جلب بيانات المحادثة ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (!conv) { router.back(); return; }

      const otherUserId = conv.user_1 === currentUserId ? conv.user_2 : conv.user_1;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, gender, last_active_at, is_photos_blurred')
        .eq('id', otherUserId)
        .single();

      if (!profile) { router.back(); return; }

      setRecipient({
        id:                profile.id,
        name:              profile.full_name ?? 'مستخدم',
        avatar:            profile.avatar_url ?? '',
        role:              profile.role ?? 'user',
        gender:            profile.gender,
        last_seen:         profile.last_active_at,
        is_photos_blurred: profile.is_photos_blurred ?? false,
      });
    };

    load();
  }, [conversationId, currentUserId]);

  // ── فحص الحظر + مراقبة realtime ──────────────────────────
  useEffect(() => {
    if (!recipient) return;

    const checkBlock = async () => {
      const { data } = await supabase
        .from('blocks')
        .select('id')
        .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${recipient.id}),and(blocker_id.eq.${recipient.id},blocked_id.eq.${currentUserId})`)
        .maybeSingle();
      setIsBlocked(!!data);
    };

    checkBlock();

    // ✅ realtime — يُغلق النافذة فوراً عند الحظر بدون ريفرش
    const channel = supabase
      .channel(`blocks_${currentUserId}_${recipient.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'blocks' },
        payload => {
          const { blocker_id, blocked_id } = payload.new;
          const involved =
            (blocker_id === currentUserId && blocked_id === recipient.id) ||
            (blocker_id === recipient.id   && blocked_id === currentUserId);
          if (involved) {
            setIsBlocked(true);
            // ✅ نُغلق النافذة فوراً وننتقل للخلف
            router.back();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'blocks' },
        payload => {
          const { blocker_id, blocked_id } = payload.old;
          const involved =
            (blocker_id === currentUserId && blocked_id === recipient.id) ||
            (blocker_id === recipient.id   && blocked_id === currentUserId);
          if (involved) setIsBlocked(false);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [recipient, currentUserId]);

  // جاري الفحص — لا نعرض شيئاً حتى نعرف الحالة
  if (!recipient || isBlocked === null) return null;

  // محظور — لا نعرض النافذة
  if (isBlocked) {
    router.back();
    return null;
  }

  return (
    <ChatWindow
      conversationId={conversationId}
      currentUserId={currentUserId}
      recipient={recipient}
      onBack={() => router.back()}
    />
  );
}