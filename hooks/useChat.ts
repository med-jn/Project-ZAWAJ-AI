/**
 * 📁 hooks/useChat.ts — ZAWAJ AI v2
 *
 * ✅ دعم الرسائل الصوتية (message_type + audio_url)
 * ✅ نظام فتح المحادثة (is_unlocked)
 * ✅ التحقق من الإعجاب قبل خصم النقاط
 * ✅ sendVoiceMessage مُصدَّرة
 * ✅ FIX: realtime INSERT يجلب الرسالة كاملة (audio_url لا يأتي في payload.new)
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { uploadVoiceMessage } from '@/lib/supabase/chatStorage';

// ──────────────────────────────────────────────────────────────
export interface ChatMessage {
  id:              string;
  conversation_id: string;
  sender_id:       string;
  content:         string;
  message_type:    'text' | 'voice';
  audio_url?:      string | null;
  is_read:         boolean;
  created_at:      string;
  is_optimistic?:  boolean;
  failed?:         boolean;
}

export interface ConversationStatus {
  is_unlocked:    boolean;
  is_free:        boolean;
  pending_unlock: boolean;
}

function makeTempId(): string {
  return `temp_${Date.now()}_${Math.floor(Math.random() * 99999)}`;
}

// ── SELECT columns — مركزية لتجنب النسيان ──────────────────────
const MSG_SELECT = 'id, conversation_id, sender_id, content, message_type, audio_url, is_read, created_at';

// ──────────────────────────────────────────────────────────────
export function useChat(
  conversationId: string | null,
  userId:         string,
  recipientId:    string
) {
  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [convStatus, setConvStatus] = useState<ConversationStatus>({
    is_unlocked:    false,
    is_free:        false,
    pending_unlock: false,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── جلب حالة المحادثة ────────────────────────────────────────
  const fetchConvStatus = async () => {
    if (!conversationId || !userId || !recipientId) return;

    const { data: conv } = await supabase
      .from('conversations')
      .select('is_unlocked')
      .eq('id', conversationId)
      .single();

    if (conv?.is_unlocked) {
      setConvStatus({ is_unlocked: true, is_free: true, pending_unlock: false });
      return;
    }

    const { data: theyLikedMe } = await supabase
      .from('likes')
      .select('id')
      .eq('from_user', recipientId)
      .eq('to_user', userId)
      .in('action', ['like', 'super_like'])
      .maybeSingle();

    const { data: isMatch } = await supabase
      .from('likes')
      .select('is_match')
      .eq('from_user', userId)
      .eq('to_user', recipientId)
      .eq('is_match', true)
      .maybeSingle();

    const isFree = !!(theyLikedMe || isMatch);

    const { data: myMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_id', userId)
      .limit(1);

    const { data: theirMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_id', recipientId)
      .limit(1);

    const iSentFirst    = (myMessages?.length ?? 0) > 0;
    const theyReplied   = (theirMessages?.length ?? 0) > 0;
    const pendingUnlock = iSentFirst && !theyReplied && !isFree;

    setConvStatus({
      is_unlocked:    isFree || theyReplied,
      is_free:        isFree,
      pending_unlock: pendingUnlock,
    });
  };

  // ── جلب الرسائل ──────────────────────────────────────────────
  const fetchMessages = async () => {
    if (!conversationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select(MSG_SELECT)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(80);
    if (!error && data) setMessages(data as ChatMessage[]);
    setLoading(false);
  };

  // ── فتح المحادثة في DB ────────────────────────────────────────
  const unlockConversation = async () => {
    if (!conversationId) return;
    await supabase
      .from('conversations')
      .update({ is_unlocked: true })
      .eq('id', conversationId);
  };

  // ── تحديد كمقروء ─────────────────────────────────────────────
  const markConversationRead = async () => {
    if (!conversationId || !userId) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);
    setMessages(prev =>
      prev.map(m => m.sender_id !== userId ? { ...m, is_read: true } : m)
    );
  };

  // ── Realtime ─────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();
    fetchConvStatus();

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        // ✅ FIX: payload.new لا يحتوي دائماً على audio_url
        // نجلب الرسالة كاملة من DB باستخدام id
        async payload => {
          const { data: fullMsg } = await supabase
            .from('messages')
            .select(MSG_SELECT)
            .eq('id', payload.new.id)
            .single();

          const newMsg = (fullMsg ?? payload.new) as ChatMessage;

          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;

            // استبدال الرسالة المتفائلة إن وُجدت
            const tempIdx = prev.findIndex(m =>
              m.is_optimistic &&
              m.sender_id === newMsg.sender_id &&
              m.content   === newMsg.content &&
              Math.abs(
                new Date(m.created_at).getTime() -
                new Date(newMsg.created_at).getTime()
              ) < 10_000
            );

            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = { ...newMsg, is_optimistic: false };
              return updated;
            }

            return [...prev, newMsg];
          });

          if (newMsg.sender_id === recipientId) {
            setConvStatus(prev => ({ ...prev, is_unlocked: true, pending_unlock: false }));
            unlockConversation();
          }
          if (newMsg.sender_id !== userId) markConversationRead();
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'DELETE',
          schema: 'public',
          table:  'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'conversations',
          filter: `id=eq.${conversationId}`,
        },
        payload => {
          if (payload.new?.is_unlocked) {
            setConvStatus(prev => ({ ...prev, is_unlocked: true, pending_unlock: false }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, userId, recipientId]);

  // ── قبول المحادثة ─────────────────────────────────────────────
  const acceptConversation = async () => {
    await unlockConversation();
    setConvStatus(prev => ({ ...prev, is_unlocked: true, pending_unlock: false }));
  };

  // ── إرسال نص ─────────────────────────────────────────────────
  const sendMessage = async (content: string): Promise<boolean> => {
    if (!content.trim() || !conversationId || !userId) return false;

    const tid = makeTempId();
    const optimistic: ChatMessage = {
      id:              tid,
      conversation_id: conversationId,
      sender_id:       userId,
      content,
      message_type:    'text',
      is_read:         false,
      created_at:      new Date().toISOString(),
      is_optimistic:   true,
    };

    setMessages(prev => [...prev, optimistic]);

    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: userId, content, message_type: 'text' });

    if (error) {
      setMessages(prev =>
        prev.map(m => m.id === tid ? { ...m, failed: true, is_optimistic: false } : m)
      );
      return false;
    }

    await supabase
      .from('conversations')
      .update({ last_message: content, last_message_time: new Date().toISOString() })
      .eq('id', conversationId);

    return true;
  };

  // ── إرسال صوتي ───────────────────────────────────────────────
  const sendVoiceMessage = async (audioBlob: Blob): Promise<boolean> => {
    if (!conversationId || !userId) return false;

    const tid = makeTempId();
    const optimistic: ChatMessage = {
      id:              tid,
      conversation_id: conversationId,
      sender_id:       userId,
      content:         '🎤 رسالة صوتية',
      message_type:    'voice',
      audio_url:       null,         // مؤقت — سيُستبدل بعد الرفع
      is_read:         false,
      created_at:      new Date().toISOString(),
      is_optimistic:   true,
    };

    setMessages(prev => [...prev, optimistic]);

    try {
      const audioUrl = await uploadVoiceMessage(audioBlob, userId, conversationId);

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id:       userId,
          content:         '🎤 رسالة صوتية',
          message_type:    'voice',
          audio_url:       audioUrl,   // ← URL الكامل من getPublicUrl
        });

      if (error) throw error;

      // ✅ تحديث الرسالة المتفائلة محلياً بـ audioUrl فوراً (قبل ما يجي الـ realtime)
      setMessages(prev =>
        prev.map(m =>
          m.id === tid
            ? { ...m, audio_url: audioUrl, is_optimistic: false }
            : m
        )
      );

      await supabase
        .from('conversations')
        .update({ last_message: '🎤 رسالة صوتية', last_message_time: new Date().toISOString() })
        .eq('id', conversationId);

      return true;

    } catch (err) {
      console.error('[useChat] voice send error:', err);
      setMessages(prev =>
        prev.map(m => m.id === tid ? { ...m, failed: true, is_optimistic: false } : m)
      );
      return false;
    }
  };

  // ── مؤشر الكتابة ─────────────────────────────────────────────
  const setTyping = (isTyping: boolean) => {
    channelRef.current?.track({ user_id: userId, typing: isTyping });
  };

  // ── حذف رسالة ────────────────────────────────────────────────
  const deleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId);
  };

  return {
    messages,
    loading,
    convStatus,
    sendMessage,
    sendVoiceMessage,
    setTyping,
    deleteMessage,
    markConversationRead,
    acceptConversation,
    refetchStatus: fetchConvStatus,
  };
}