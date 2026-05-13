'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

import ChatPage from '@/components/chat/ChatPage';
import { supabase } from '@/lib/supabase/client';

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const conversationId = searchParams.get('id');

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(data.user.id);
    });
  }, []);

  if (!conversationId || !currentUserId) {
    return null;
  }

  return (
    <ChatPage
      conversationId={conversationId}
      currentUserId={currentUserId}
    />
  );
}

export default function ChatRoutePage() {
  return (
    <Suspense fallback={null}>
      <ChatContent />
    </Suspense>
  );
}