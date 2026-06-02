'use client';
/**
 * 📁 components/chat/ChatWindow.tsx — ZAWAJ AI v2.2
 *
 * ✅ position:fixed للهيدر — zIndex:1000 (فوق ClientLayout دائماً)
 * ✅ RTL صريح: السهم يسار ← avatar+اسم وسط ← نقاط يمين
 * ✅ OnlineDot على حافة الأفاتار بالضبط (مركز النقطة على الحافة)
 * ✅ "يكتب الآن" عند الحاجة فقط
 * ✅ ألوان فقاعات صلبة
 * ✅ بانر قبول + بانر انتظار
 * ✅ ReportSheet الكامل
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, CheckCheck,
  MoreVertical, ShieldOff,
  Clock, MessageCircle, Trash2,
} from 'lucide-react';

import { supabase }       from '@/lib/supabase/client';
import { useChat }        from '@/hooks/useChat';
import { useGiftCoins }   from '@/hooks/useGiftCoins';
import OnlineDot          from '@/components/profile/OnlineDot';
import VoiceRecorder      from './VoiceRecorder';
import VoiceMessageBubble from './VoiceMessageBubble';
import ReportSheet        from '@/components/security/ReportSheet';

// ── helpers ───────────────────────────────────────────────────
function msgTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s    = Math.floor(diff / 1000);
  if (s < 60)  return 'الآن';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} س`;
  return new Date(dateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}

// ── Types ──────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────
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
  const [longPressId,  setLongPressId]  = useState<string | null>(null);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [isTyping,     setIsTyping]     = useState(false);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFemale = recipient.gender === 'female';

  // ── Presence ──────────────────────────────────────────────────
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

  // ── إرسال نص ──────────────────────────────────────────────────
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

  // ── إرسال صوت ─────────────────────────────────────────────────
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

  const handleTouchStart = (msgId: string) => {
    pressTimer.current = setTimeout(() => setLongPressId(msgId), 500);
  };
  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
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

  // ── حجم الأفاتار والنقطة ──────────────────────────────────────
  // النقطة مركزها يقع على حافة دائرة الأفاتار
  // أفاتار: 40px ← نصف القطر = 20px
  // نقطة: 13px ← نصف = 6.5px
  // bottom = نصف_القطر_أفاتار - نصف_النقطة = 20 - 6.5 = 13.5 ≈ 14 (من أسفل wrapper)
  // ← لكن OnlineDot يستخدم position:absolute بـ bottom/right محسوبة بـ size*0.45
  // size=13 → bottom = 13*0.45 = 5.85 ← هذا بعيد عن الحافة
  // الحل: نضع OnlineDot خارج دائرة الأفاتار مع top/left صريح

  const AVATAR_SIZE = 40;
  const DOT_SIZE    = 13;
  // مركز النقطة يقع على حافة الدائرة (نقطة الساعة 4:30)
  // right = -(DOT_SIZE/2) → مركز النقطة عند حافة اليمين
  // bottom = -(DOT_SIZE/2) → مركز النقطة عند حافة الأسفل
  const DOT_OFFSET  = -(DOT_SIZE / 2); // -6.5px

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-main)',
      display: 'flex', flexDirection: 'column',
      // ✅ zIndex 1000 يضمن الظهور فوق أي layout
      zIndex: 1000,
    }}>

      {/* ══════════════════════════════
          HEADER — RTL صريح بدون dir="rtl"
          ترتيب DOM = يسار←وسط←يمين
          السهم (يسار) | Avatar+اسم (يمسط) | نقاط (يمين)
      ══════════════════════════════ */}
      <div
        style={{
          paddingTop: 'var(--safe-top, env(safe-area-inset-top, 0px))',
          height: 'calc(64px + var(--safe-top, env(safe-area-inset-top, 0px)))',
          display: 'flex',
          flexDirection: 'row',          // LTR في DOM
          alignItems: 'center',
          paddingLeft: 4,
          paddingRight: 4,
          gap: 4,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--glass-border)',
          flexShrink: 0,
          // ✅ position sticky بدل fixed منفصل — يبقى مع الـ flex column
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* ── يسار: سهم رجوع ← ─────────────────────────────── */}
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            width: 44, height: 44, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-main)',
          }}
        >
          <ArrowLeft size={22} />
        </button>

        {/* ── وسط: Avatar + اسم ────────────────────────────── */}
        <button
          onClick={() => onOpenProfile?.(recipient.id)}
          style={{
            display: 'flex', alignItems: 'center',
            flexDirection: 'row-reverse',  // أفاتار يمين الاسم (RTL visual)
            gap: 10,
            background: 'transparent', border: 'none', cursor: 'pointer',
            flex: 1, minWidth: 0,
            textAlign: 'right', padding: '0 4px',
          }}
        >
          {/* الأفاتار مع OnlineDot */}
          <div style={{
            position: 'relative',
            width:  AVATAR_SIZE,
            height: AVATAR_SIZE,
            flexShrink: 0,
          }}>
            <div style={{
              width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%',
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

            {/*
              ✅ OnlineDot: مركز النقطة يقع على حافة الدائرة تماماً
              wrapper = 40×40 → OnlineDot يضع نفسه:
                bottom = size*0.45 = 13*0.45 = 5.85 من أسفل الـ wrapper
                right  = size*0.45 = 5.85 من يمين الـ wrapper
              لكننا نريد مركز النقطة عند الحافة، إذن نحتاج:
                bottom = -(DOT_SIZE/2) = -6.5 من أسفل الـ wrapper
                right  = -(DOT_SIZE/2) = -6.5 من يمين الـ wrapper
              OnlineDot الحالي يحسب موضعه بـ size*0.45 بداخله
              لذا نضع wrapper بـ overflow:visible ونمرر size صحيح
            -->
            */}
            <div style={{
              position: 'absolute',
              // مركز النقطة (DOT_SIZE/2) على حافة الدائرة (AVATAR_SIZE/2 من المركز)
              // bottom من أسفل wrapper = AVATAR_SIZE - (AVATAR_SIZE/2 + DOT_SIZE/2)
              //   = AVATAR_SIZE/2 - DOT_SIZE/2 = 20 - 6.5 = 13.5
              // لكن OnlineDot يضيف bottom: size*0.45 داخلياً
              // إذن نضع الـ wrapper بحيث يكون bottom النقطة الفعلي صحيحاً
              // الأبسط: نتجاهل OnlineDot الداخلي ونعيد تموضعه بـ wrapper
              bottom: DOT_OFFSET,
              right:  DOT_OFFSET,
              // OnlineDot يضع نفسه absolute داخل هذا الـ div
              // لكنه يستخدم bottom:size*0.45 و right:size*0.45
              // نحتاج أن يكون top:0,left:0,bottom:0,right:0 فعلياً
              // الحل الأنظف: نعطي wrapper حجم النقطة بالضبط
              width:  DOT_SIZE,
              height: DOT_SIZE,
            }}>
              <OnlineDot
                userId={recipient.id}
                initialLastActive={recipient.last_seen}
                size={DOT_SIZE}
              />
            </div>
          </div>

          {/* الاسم + "يكتب الآن" */}
          <div style={{ minWidth: 0, textAlign: 'right' }}>
            <span style={{
              color: 'var(--text-main)', fontWeight: 700, fontSize: 15,
              display: 'block', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {recipient.name}
            </span>
            <AnimatePresence mode="wait">
              {isTyping && (
                <motion.span
                  key="typing"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{    opacity: 0, y: 4 }}
                  style={{ fontSize: 11, color: 'var(--color-gold-hover)', display: 'block' }}
                >
                  {isFemale ? 'تكتب الآن...' : 'يكتب الآن...'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </button>

        {/* ── يمين: ثلاث نقاط ──────────────────────────────── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowMenu(v => !v)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
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
                    position: 'absolute', top: 46, right: 0, zIndex: 20,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 16, overflow: 'hidden', width: 150,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {[
                    { label: 'إبلاغ', color: '#f87171',
                      action: () => { setShowMenu(false); setShowReport(true); } },
                    { label: 'حظر', icon: <ShieldOff size={13} />, color: '#fb923c',
                      action: handleBlock },
                  ].map((item, i) => (
                    <button key={item.label} onClick={item.action} style={{
                      width: '100%', padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      borderBottom: i === 0 ? '1px solid var(--glass-border)' : 'none',
                      color: item.color, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                    }}>
                      {(item as any).icon}
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════
          بانر قبول المحادثة
      ══════════════════════════════ */}
      <AnimatePresence>
        {showAcceptBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{    opacity: 0, height: 0     }}
            dir="rtl"
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
            }}>
              قبول
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════
          بانر انتظار الرد
      ══════════════════════════════ */}
      <AnimatePresence>
        {showWaitBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{    opacity: 0, height: 0     }}
            dir="rtl"
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

      {/* ══════════════════════════════
          MESSAGES
      ══════════════════════════════ */}
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
          const isMine = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              dir="rtl"
              style={{ display: 'flex', justifyContent: isMine ? 'flex-start' : 'flex-end' }}
              onTouchStart={() => isMine && handleTouchStart(msg.id)}
              onTouchEnd={handleTouchEnd}
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
                ) : msg.message_type === 'voice' && !msg.audio_url ? (
                  /* متفائلة صوتية لم يُحمَّل الـ URL بعد */
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    minWidth: 120, opacity: 0.7,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 14 }}>🎤</span>
                    </div>
                    <div style={{
                      width: 60, height: 4, borderRadius: 2,
                      background: 'rgba(255,255,255,0.2)',
                      overflow: 'hidden',
                    }}>
                      <motion.div
                        animate={{ x: ['−100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{ width: '50%', height: '100%', background: 'rgba(255,255,255,0.5)' }}
                      />
                    </div>
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

                {/* وقت + قُرئ */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  marginTop: 3, opacity: 0.6,
                  justifyContent: 'flex-end',
                }}>
                  {isMine && (
                    <CheckCheck size={11} style={{
                      color: msg.is_read ? '#4fc3f7' : 'rgba(255,255,255,0.45)',
                    }} />
                  )}
                  <span style={{
                    fontSize: 10,
                    color: isMine ? 'rgba(255,255,255,0.55)' : 'var(--text-tertiary)',
                  }}>
                    {msgTime(msg.created_at)}
                  </span>
                  {msg.failed && (
                    <span style={{ fontSize: 9, color: '#f87171' }}>!</span>
                  )}
                </div>

                {/* حذف بعد long press */}
                <AnimatePresence>
                  {isMine && longPressId === msg.id && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1   }}
                      exit={{    opacity: 0, scale: 0.7 }}
                      onClick={() => { deleteMessage(msg.id); setLongPressId(null); }}
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
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <div
        dir="rtl"
        style={{
          padding:       '8px 12px',
          paddingBottom: 'max(var(--safe-bottom, env(safe-area-inset-bottom, 0px)), 8px)',
          background:    'var(--bg-surface)',
          borderTop:     '1px solid var(--glass-border)',
          flexShrink:    0,
        }}
      >
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
            {/* زر الإرسال — يسار في RTL */}
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={handleSend}
              style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: inputText.trim()
                  ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Send size={15} color={inputText.trim() ? '#fff' : 'var(--text-tertiary)'} />
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

            {/* مسجّل الصوت — يمين في RTL */}
            <VoiceRecorder
              onSend={handleVoiceSend}
              disabled={sendingVoice || showWaitBanner}
            />
          </div>
        )}
      </div>

      {/* ReportSheet */}
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