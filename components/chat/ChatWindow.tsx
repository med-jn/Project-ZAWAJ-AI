'use client';
/**
 * 📁 components/chat/ChatWindow.tsx — ZAWAJ AI v2.5
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, CheckCheck, Check,
  MoreVertical, ShieldOff,
  Clock, MessageCircle, Trash2, Mic,
} from 'lucide-react';

import { supabase }       from '@/lib/supabase/client';
import { useChat }        from '@/hooks/useChat';
import { useGiftCoins }   from '@/hooks/useGiftCoins';
import OnlineDot          from '@/components/profile/OnlineDot';
import VoiceRecorder      from './VoiceRecorder';
import VoiceMessageBubble from './VoiceMessageBubble';
import ReportSheet        from '@/components/security/ReportSheet';

// ── تاريخ بأرقام لاتينية + 24 ساعة ──────────────────────────
function msgTime(dateStr: string): string {
  const d    = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const s    = Math.floor(diff / 1000);
  if (s < 60)  return 'الآن';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) {
    // HH:MM بأرقام لاتينية 24h
    const hh = String(d.getHours()).padStart(2, '0');
    const mm  = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  // تاريخ بأرقام لاتينية
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

interface Recipient {
  id:                string;
  name:              string;
  avatar:            string;
  role:              string;
  gender?:           string;
  last_seen?:        string;
  is_photos_blurred?: boolean;
}

interface Props {
  conversationId:  string;
  currentUserId:   string;
  recipient:       Recipient;
  onBack:          () => void;
  onOpenProfile?:  (userId: string) => void;
  onBlock?:        () => void;
}

const AVATAR = 40;
const DOT    = 13;

export default function ChatWindow({
  conversationId, currentUserId, recipient,
  onBack, onOpenProfile, onBlock,
}: Props) {

  const {
    messages, loading, convStatus,
    sendMessage, sendVoiceMessage,
    setTyping, deleteMessage,
    markConversationRead, acceptConversation,
  } = useChat(conversationId, currentUserId, recipient.id);

  const { deduct, canAfford } = useGiftCoins();

  const [inputText,    setInputText]    = useState('');
  const [showMenu,     setShowMenu]     = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [pressedId,    setPressedId]    = useState<string | null>(null);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [isTyping,     setIsTyping]     = useState(false);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFemale = recipient.gender === 'female';

  // ── Presence ───────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel(`presence_${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });
    ch
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        const other = (Object.values(state).flat() as any[])
          .find(u => u.user_id === recipient.id);
        setIsTyping(!!other?.typing);
      })
      .subscribe(async s => {
        if (s === 'SUBSCRIBED')
          await ch.track({ user_id: currentUserId, typing: false });
      });
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, recipient.id, currentUserId]);

  useEffect(() => {
    if (messages.length > 0) markConversationRead();
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    const needsCoins = !convStatus.is_free && !convStatus.is_unlocked;
    if (needsCoins) {
      if (!canAfford('message')) return;
      const ok = await deduct({ action: 'message', target_id: recipient.id });
      if (!ok) return;
    }
    const sent = await sendMessage(text);
    if (sent) { setInputText(''); setTyping(false); inputRef.current?.blur(); }
  };

  const handleVoiceSend = useCallback(async (blob: Blob) => {
    setSendingVoice(true);
    const needsCoins = !convStatus.is_free && !convStatus.is_unlocked;
    if (needsCoins) {
      if (!canAfford('message')) { setSendingVoice(false); return; }
      const ok = await deduct({ action: 'message', target_id: recipient.id });
      if (!ok) { setSendingVoice(false); return; }
    }
    await sendVoiceMessage(blob);
    setSendingVoice(false);
  }, [convStatus, canAfford, deduct, recipient.id, sendVoiceMessage]);

  const handleChange = (val: string) => {
    setInputText(val);
    setTyping(val.length > 0);
  };

  // ── لمس الرسالة → يظهر التاريخ ────────────────────────────
  const handleMsgTouch = (msgId: string) => {
    setPressedId(prev => prev === msgId ? null : msgId);
  };

  const handleBlock = async () => {
    setShowMenu(false);
    await supabase.from('likes').upsert(
      { from_user: currentUserId, to_user: recipient.id, action: 'block' },
      { onConflict: 'from_user,to_user,action' }
    );
    onBlock?.();
    onBack();
  };

  const showAcceptBanner =
    !convStatus.is_unlocked && !convStatus.is_free &&
    !convStatus.pending_unlock &&
    messages.some(m => m.sender_id === recipient.id);

  const showWaitBanner = convStatus.pending_unlock;
  const hasText        = inputText.trim().length > 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'var(--bg-main)',
        display: 'flex', flexDirection: 'column', zIndex: 1000 }}
      onClick={() => pressedId && setPressedId(null)}
    >

      {/* ══════════════════════════════
          HEADER — dir="rtl" مثل PageHeader
          ترتيب DOM (RTL يعكسه):
          [اسم+أفاتار flex-1] [نقاط] [سهم]
          النتيجة المرئية:
          [سهم يسار] [أفاتار+اسم وسط] [نقاط يمين]
      ══════════════════════════════ */}
      <header
        dir="rtl"
        style={{
          position:      'fixed',
          top: 0, right: 0, left: 0,
          zIndex:        1001,
          height:        'var(--header-h, 60px)',
          paddingTop:    'var(--safe-top, env(safe-area-inset-top, 0px))',
          display:       'flex',
          alignItems:    'center',
          padding:       '0 4px',
          paddingTop:    'var(--safe-top, env(safe-area-inset-top, 0px))',
          gap:           4,
          background:    'var(--bg-surface)',
          borderBottom:  '1px solid var(--glass-border)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {/* ① اسم + أفاتار — flex-1 (يمين في RTL) */}
        <button
          onClick={() => onOpenProfile?.(recipient.id)}
          style={{
            flex: 1, minWidth: 0,
            display: 'flex', alignItems: 'center',
            flexDirection: 'row', // أفاتار أولاً ثم الاسم (RTL: أفاتار يمين)
            gap: 10,
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '0 4px', textAlign: 'right',
          }}
        >
          {/* الأفاتار مع OnlineDot */}
          <div style={{ position: 'relative', width: AVATAR, height: AVATAR, flexShrink: 0 }}>
            <div style={{
              width: AVATAR, height: AVATAR, borderRadius: '50%',
              overflow: 'hidden',
              border: '1.5px solid var(--glass-border)',
              background: 'var(--glass-bg)',
            }}>
              <img
                src={recipient.avatar || '/default-avatar.png'}
                alt=""
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  filter:    recipient.is_photos_blurred ? 'blur(8px)'   : 'none',
                  transform: recipient.is_photos_blurred ? 'scale(1.15)' : 'none',
                  transition: 'filter 0.3s',
                }}
              />
            </div>
            <div style={{
              position: 'absolute',
              bottom: -(DOT / 2), right: -(DOT / 2),
              width: DOT, height: DOT,
            }}>
              <OnlineDot
                userId={recipient.id}
                initialLastActive={recipient.last_seen}
                size={DOT}
              />
            </div>
          </div>

          {/* الاسم + يكتب الآن */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{
              color: 'var(--text-main)', fontWeight: 700, fontSize: 15,
              display: 'block', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {recipient.name}
            </span>
            <AnimatePresence mode="wait">
              {isTyping && (
                <motion.span key="typing"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  style={{ fontSize: 11, color: 'var(--color-gold-hover)', display: 'block' }}
                >
                  {isFemale ? 'تكتب الآن...' : 'يكتب الآن...'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </button>

        {/* ② ثلاث نقاط (في RTL: يسار الأفاتار، مرئياً: يمين الشاشة بعد الأفاتار) */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowMenu(v => !v)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-tertiary)',
          }}>
            <MoreVertical size={20} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                  onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: -8 }}
                  animate={{ opacity: 1, scale: 1,    y: 0  }}
                  exit={{    opacity: 0, scale: 0.88, y: -8 }}
                  transition={{ duration: 0.15 }}
                  dir="rtl"
                  style={{
                    position: 'absolute', top: 46, left: 0, zIndex: 20,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 16, overflow: 'hidden', width: 150,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {[
                    { label: 'إبلاغ', color: '#f87171',
                      action: () => { setShowMenu(false); setShowReport(true); } },
                    { label: 'حظر', icon: <ShieldOff size={13}/>, color: '#fb923c',
                      action: handleBlock },
                  ].map((item, i) => (
                    <button key={item.label} onClick={item.action} style={{
                      width: '100%', padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      borderBottom: i === 0 ? '1px solid var(--glass-border)' : 'none',
                      color: item.color, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                    }}>
                      {(item as any).icon}{item.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* ③ سهم الرجوع (في RTL: آخر عنصر = يسار الشاشة) */}
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          width: 44, height: 44, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-main)',
        }}>
          <ArrowLeft size={22} />
        </button>
      </header>

      {/* spacer للهيدر الـ fixed */}
      <div style={{ height: 'var(--header-h, 60px)', flexShrink: 0 }} />

      {/* بانر قبول */}
      <AnimatePresence>
        {showAcceptBanner && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} dir="rtl"
            style={{
              background: 'rgba(164,22,26,0.10)',
              borderBottom: '1px solid var(--border-soft)',
              padding: '10px 14px', flexShrink: 0,
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 10, overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <MessageCircle size={14} color="var(--color-primary)" />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                هل تريد قبول هذه المحادثة؟
              </span>
            </div>
            <button onClick={acceptConversation} style={{
              padding: '5px 14px', borderRadius: 20,
              background: 'var(--color-accent)', border: 'none',
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0,
            }}>قبول</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* بانر انتظار */}
      <AnimatePresence>
        {showWaitBanner && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} dir="rtl"
            style={{
              background: 'rgba(234,179,8,0.08)',
              borderBottom: '1px solid rgba(234,179,8,0.2)',
              padding: '8px 14px', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden',
            }}
          >
            <Clock size={13} color="#ca8a04" />
            <span style={{ fontSize: 11, color: '#ca8a04' }}>
              في انتظار رد {isFemale ? 'الطرف الأخرى' : 'الطرف الآخر'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* الرسائل */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '12px 12px 8px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flex: 1, color: 'var(--text-tertiary)', fontSize: 13,
          }}>
            جارٍ التحميل...
          </div>
        ) : messages.map(msg => {
          const isMine    = msg.sender_id === currentUserId;
          const isPressed = pressedId === msg.id;

          return (
            <div key={msg.id} dir="rtl"
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMine ? 'flex-start' : 'flex-end',
                gap: 2,
              }}
              onClick={e => { e.stopPropagation(); handleMsgTouch(msg.id); }}
            >
              <div style={{
                maxWidth: '78%', position: 'relative',
                padding: '9px 13px', borderRadius: 18,
                borderBottomRightRadius: isMine ? 4  : 18,
                borderBottomLeftRadius:  isMine ? 18 : 4,
                background: isMine ? '#8B1A1A' : 'var(--bg-elevated)',
                border: `1px solid ${isMine ? 'rgba(139,26,26,0.6)' : 'var(--glass-border)'}`,
                opacity: msg.is_optimistic ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}>

                {msg.message_type === 'voice' && msg.audio_url ? (
                  <VoiceMessageBubble audioUrl={msg.audio_url} isMine={isMine} />
                ) : msg.message_type === 'voice' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120, opacity: 0.7 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Mic size={14} color="rgba(255,255,255,0.7)" />
                    </div>
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      style={{ width: 60, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }}
                    />
                  </div>
                ) : (
                  <p style={{
                    margin: 0, fontSize: 14, lineHeight: 1.6,
                    color: isMine ? '#ffffff' : 'var(--text-main)',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </p>
                )}

                {/* زر الحذف عند اللمس — رسائلي فقط */}
                <AnimatePresence>
                  {isMine && isPressed && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1   }}
                      exit={{    opacity: 0, scale: 0.7 }}
                      onClick={e => {
                        e.stopPropagation();
                        deleteMessage(msg.id);
                        setPressedId(null);
                      }}
                      style={{
                        position: 'absolute', top: -12, right: -10,
                        width: 28, height: 28, borderRadius: '50%',
                        background: '#f87171', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={12} color="#fff" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* ✅ وقت + حالة القراءة — يظهر عند اللمس */}
              <AnimatePresence>
                {isPressed && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0   }}
                    exit={{    opacity: 0, y: -4   }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      paddingInline: 6,
                    }}
                  >
                    {/* ✅ علامة القراءة الحقيقية */}
                    {isMine && (
                      msg.is_read
                        ? <CheckCheck size={12} color="#4fc3f7" />
                        : <Check      size={12} color="var(--text-tertiary)" />
                    )}
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {msgTime(msg.created_at)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* شريط الإدخال */}
      <div dir="rtl" style={{
        padding:       '8px 12px',
        paddingBottom: 'max(var(--safe-bottom, env(safe-area-inset-bottom, 0px)), 8px)',
        background:    'var(--bg-surface)',
        borderTop:     '1px solid var(--glass-border)',
        flexShrink:    0,
      }}>
        {showWaitBanner ? (
          <div style={{
            height: 46, borderRadius: 30,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              في انتظار الطرف الآخر...
            </span>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 30, padding: '4px',
          }}>
            {/* زر الإرسال */}
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={handleSend}
              style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: hasText ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
            >
              <Send size={15} color={hasText ? '#ffffff' : 'var(--text-tertiary)'} />
            </motion.button>

            {/* حقل النص */}
            <input
              ref={inputRef}
              type="text" dir="rtl"
              placeholder="اكتب رسالتك..."
              value={inputText}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: 'var(--text-main)', fontSize: 14,
                outline: 'none', fontFamily: 'inherit', padding: '0 8px',
              }}
            />

            <VoiceRecorder
              onSend={handleVoiceSend}
              disabled={sendingVoice || showWaitBanner}
            />
          </div>
        )}
      </div>

      <ReportSheet
        open={showReport}
        onClose={() => setShowReport(false)}
        reportedUserId={recipient.id}
        targetType="conversation"
        targetId={conversationId}
      />
    </div>
  );
}