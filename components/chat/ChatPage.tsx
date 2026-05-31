'use client';
/**
 * 📁 components/chat/ChatPage.tsx — ZAWAJ AI v2
 * يجلب بيانات المحادثة ويمرر recipientId لـ ChatWindow
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
  const [recipient, setRecipient] = useState<Recipient | null>(null);

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

  if (!recipient) return null;

  return (
    <ChatWindow
      conversationId={conversationId}
      currentUserId={currentUserId}
      recipient={recipient}
      onBack={() => router.back()}
    />
  );
}