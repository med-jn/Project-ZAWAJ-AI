/**
 * 📁 hooks/useChat.ts — ZAWAJ AI v2
 *
 * ✅ دعم الرسائل الصوتية (message_type + audio_url)
 * ✅ نظام فتح المحادثة (is_unlocked)
 * ✅ sendVoiceMessage مُصدَّرة
 * ✅ FIX: جلب آخر 80 رسالة (DESC ثم عكس) لضمان ظهور الجديدة
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { uploadVoiceMessage } from '@/lib/supabase/chatStorage';

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

  const channelRef      = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [recipientTyping, setRecipientTyping] = useState(false);

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
      .from('likes').select('id')
      .eq('from_user', recipientId).eq('to_user', userId)
      .in('action', ['like', 'super_like']).maybeSingle();

    const { data: isMatch } = await supabase
      .from('likes').select('is_match')
      .eq('from_user', userId).eq('to_user', recipientId)
      .eq('is_match', true).maybeSingle();

    const isFree = !!(theyLikedMe || isMatch);

    const { data: myMessages } = await supabase
      .from('messages').select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_id', userId).limit(1);

    const { data: theirMessages } = await supabase
      .from('messages').select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_id', recipientId).limit(1);

    const iSentFirst    = (myMessages?.length ?? 0) > 0;
    const theyReplied   = (theirMessages?.length ?? 0) > 0;
    const pendingUnlock = iSentFirst && !theyReplied && !isFree;

    setConvStatus({
      is_unlocked:    isFree || theyReplied,
      is_free:        isFree,
      pending_unlock: pendingUnlock,
    });
  };

  // ✅ FIX: نجلب آخر 80 رسالة (DESC) ثم نعكسها للعرض الصحيح
  const fetchMessages = async () => {
    if (!conversationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, message_type, audio_url, is_read, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false }) // ← أحدث أولاً
      .limit(80);
    if (!error && data) {
      setMessages([...data].reverse()); // ← نعكس للترتيب الصحيح
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();
    fetchConvStatus();

    const channel = supabase
      .channel(`chat_${conversationId}`, {
        config: { presence: { key: userId } },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const other = (Object.values(state).flat() as any[])
          .find((u: any) => u.user_id === recipientId);
        setRecipientTyping(!!other?.typing);
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversationId}` },
        payload => {
          const raw = payload.new as ChatMessage;

          // ── رسالة صوتية من المُرسِل نفسه ──────────────────
          // sendVoiceMessage تحدّثها مباشرة — نتجاهل الـ realtime
          if (raw.message_type === 'voice' && raw.sender_id === userId) return;

          // ── رسالة صوتية من الطرف الآخر ────────────────────
          // payload.new لا يحمل audio_url — نجلب الكاملة
          if (raw.message_type === 'voice' && raw.sender_id !== userId) {
            void (async () => {
              const { data: fullMsg } = await supabase
                .from('messages')
                .select('id, conversation_id, sender_id, content, message_type, audio_url, is_read, created_at')
                .eq('id', raw.id)
                .single();
              const newMsg = (fullMsg ?? raw) as ChatMessage;
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              setConvStatus(prev => ({ ...prev, is_unlocked: true, pending_unlock: false }));
              unlockConversation();
              markConversationRead();
            })();
            return;
          }

          // ── رسالة نصية ────────────────────────────────────
          setMessages(prev => {
            if (prev.some(m => m.id === raw.id)) return prev;
            const tempIdx = prev.findIndex(m =>
              m.is_optimistic &&
              m.sender_id === raw.sender_id &&
              m.content   === raw.content &&
              Math.abs(new Date(m.created_at).getTime() - new Date(raw.created_at).getTime()) < 10000
            );
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = { ...raw, is_optimistic: false };
              return updated;
            }
            return [...prev, raw];
          });
          if (raw.sender_id === recipientId) {
            setConvStatus(prev => ({ ...prev, is_unlocked: true, pending_unlock: false }));
            unlockConversation();
          }
          if (raw.sender_id !== userId) markConversationRead();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversationId}` },
        payload => {
          // ✅ حذف فوري للطرفين في الوقت الحقيقي
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      // ✅ مراقبة is_read في الوقت الفعلي
      // عند أي UPDATE نحدّث كل الرسائل المرسلة مني دفعة واحدة
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversationId}` },
        payload => {
          const updated = payload.new as ChatMessage;
          if (updated.is_read) {
            // الطرف الآخر قرأ — نعلّم كل رسائلي كمقروءة
            setMessages(prev =>
              prev.map(m =>
                m.sender_id === userId && !m.is_read
                  ? { ...m, is_read: true }
                  : m
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations',
          filter: `id=eq.${conversationId}` },
        payload => {
          if (payload.new?.is_unlocked) {
            setConvStatus(prev => ({ ...prev, is_unlocked: true, pending_unlock: false }));
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, typing: false });
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, userId, recipientId]);

  const unlockConversation = async () => {
    if (!conversationId) return;
    await supabase.from('conversations')
      .update({ is_unlocked: true }).eq('id', conversationId);
  };

  const acceptConversation = async () => {
    await unlockConversation();
    setConvStatus(prev => ({ ...prev, is_unlocked: true, pending_unlock: false }));
  };

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

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id:       userId,
      content,
      message_type:    'text',
    });

    if (error) {
      setMessages(prev =>
        prev.map(m => m.id === tid ? { ...m, failed: true, is_optimistic: false } : m)
      );
      return false;
    }

    await supabase.from('conversations')
      .update({ last_message: content, last_message_time: new Date().toISOString() })
      .eq('id', conversationId);

    return true;
  };

  const sendVoiceMessage = async (audioBlob: Blob): Promise<boolean> => {
    if (!conversationId || !userId) return false;

    const tid = makeTempId();
    const optimistic: ChatMessage = {
      id:              tid,
      conversation_id: conversationId,
      sender_id:       userId,
      content:         '',
      message_type:    'voice',
      audio_url:       null,
      is_read:         false,
      created_at:      new Date().toISOString(),
      is_optimistic:   true,
    };

    setMessages(prev => [...prev, optimistic]);

    try {
      const audioUrl = await uploadVoiceMessage(audioBlob, userId, conversationId);

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id:       userId,
        content:         '',
        message_type:    'voice',
        audio_url:       audioUrl,
      });

      if (error) throw error;

      setMessages(prev =>
        prev.map(m => m.id === tid
          ? { ...m, audio_url: audioUrl, is_optimistic: false }
          : m
        )
      );

      await supabase.from('conversations')
        .update({ last_message: '🎤', last_message_time: new Date().toISOString() })
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

  const setTyping = (isTyping: boolean) => {
    channelRef.current?.track({ user_id: userId, typing: isTyping })
      .catch(() => {});
  };

  const deleteMessage = async (messageId: string) => {
    // ✅ حذف للطرفين — بدون قيد sender_id
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await supabase.from('messages').delete().eq('id', messageId);
  };

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

  return {
    messages,
    loading,
    convStatus,
    recipientTyping,
    sendMessage,
    sendVoiceMessage,
    setTyping,
    deleteMessage,
    markConversationRead,
    acceptConversation,
    refetchStatus: fetchConvStatus,
  };
}