/**
 * 📁 hooks/useChat.ts
 * ZAWAJ AI — hook الدردشة
 * ✅ insert بدون .select() لتجنب خطأ RLS 400
 * ✅ بدون crypto.randomUUID (يكسر على الهاتف بـ IP)
 * ✅ setTyping مُصدَّرة صراحةً
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  is_optimistic?: boolean;
  failed?: boolean;
}

function makeTempId(): string {
  return `temp_${Date.now()}_${Math.floor(Math.random() * 99999)}`;
}

// ──────────────────────────────────────────────────────────────
export function useChat(conversationId: string | null, userId: string) {

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading,  setLoading]  = useState(true);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── جلب الرسائل ──────────────────────────────────────────
  const fetchMessages = async () => {
    if (!conversationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, is_read, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(80);
    if (!error && data) setMessages(data);
    setLoading(false);
  };

  // ── Realtime ─────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversationId}` },
        payload => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => {
            // إذا الـ ID موجود فعلاً، تجاهل
            if (prev.some(m => m.id === newMsg.id)) return prev;
            // إذا رسالة مؤقتة بنفس المحتوى والمُرسِل خلال آخر 10 ثوانٍ، استبدلها
            const tempIdx = prev.findIndex(m =>
              m.is_optimistic &&
              m.sender_id === newMsg.sender_id &&
              m.content   === newMsg.content &&
              Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 10000
            );
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = { ...newMsg, is_optimistic: false };
              return updated;
            }
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== userId) markConversationRead();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversationId}` },
        payload => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // ── إرسال (Optimistic بدون .select() لتجنب RLS) ──────────
  const sendMessage = async (content: string) => {
    if (!content.trim() || !conversationId || !userId) return;

    const tid = makeTempId();
    const optimistic: ChatMessage = {
      id:              tid,
      conversation_id: conversationId,
      sender_id:       userId,
      content,
      is_read:         false,
      created_at:      new Date().toISOString(),
      is_optimistic:   true,
    };

    setMessages(prev => [...prev, optimistic]);

    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: userId, content });

    if (error) {
      console.error('[useChat] insert error:', error.message);
      setMessages(prev =>
        prev.map(m => m.id === tid ? { ...m, failed: true, is_optimistic: false } : m)
      );
      return;
    }

    // تحديث آخر رسالة
    await supabase
      .from('conversations')
      .update({ last_message: content, last_message_time: new Date().toISOString() })
      .eq('id', conversationId);
    // Realtime سيستبدل الرسالة المؤقتة بالحقيقية تلقائياً
  };

  // ── مؤشر الكتابة ─────────────────────────────────────────
  const setTyping = (isTyping: boolean) => {
    channelRef.current?.track({ user_id: userId, typing: isTyping });
  };

  // ── حذف رسالة ────────────────────────────────────────────
  const deleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await supabase.from('messages').delete()
      .eq('id', messageId).eq('sender_id', userId);
  };

  // ── تحديد كمقروء ─────────────────────────────────────────
  const markConversationRead = async () => {
    if (!conversationId || !userId) return;
    await supabase.from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);
    setMessages(prev =>
      prev.map(m => m.sender_id !== userId ? { ...m, is_read: true } : m)
    );
  };

  return { messages, loading, sendMessage, setTyping, deleteMessage, markConversationRead };
}