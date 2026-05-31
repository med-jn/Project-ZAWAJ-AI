'use client';
/**
 * 📁 components/chat/ChatWindow.tsx — ZAWAJ AI v2
 *
 * ✅ Header: أفاتار + اسم + OnlineDot + حالة الاتصال + ثلاث نقاط (بلاغ فقط)
 * ✅ رسائل نصية وصوتية
 * ✅ بانر "قبول المحادثة" للمستقبل
 * ✅ بانر "في انتظار الرد" للمرسل
 * ✅ نظام خصم النقاط على أول رسالة
 * ✅ ألوان فقاعات واضحة (بدون شفافية مفرطة)
 * ✅ ReportSheet الكامل
 */

import {
  useEffect, useRef, useState, useCallback,
} from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Send, CheckCheck,
  MoreVertical, Trash2, ShieldOff, Clock,
  MessageCircle,
} from 'lucide-react';

import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import { supabase }             from '@/lib/supabase/client';
import { useChat }              from '@/hooks/useChat';
import { useGiftCoins }         from '@/hooks/useGiftCoins';
import OnlineDot                from '@/components/profile/OnlineDot';
import VoiceRecorder            from './VoiceRecorder';
import VoiceMessageBubble       from './VoiceMessageBubble';
import ReportSheet              from '@/components/security/ReportSheet';

// ──────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface Recipient {
  id:                string;
  name:              string;
  avatar:            string;
  role:              string;
  gender?:           string;
  last_seen?:        string;
  is_photos_blurred?: boolean;
}

interface ChatWindowProps {
  conversationId:   string;
  currentUserId:    string;
  recipient:        Recipient;
  onBack:           () => void;
  onOpenProfile?:   (userId: string) => void;
  onBlock?:         () => void;
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function ChatWindow({
  conversationId,
  currentUserId,
  recipient,
  onBack,
  onOpenProfile,
  onBlock,
}: ChatWindowProps) {

  const {
    messages,
    loading,
    convStatus,
    sendMessage,
    sendVoiceMessage,
    setTyping,
    deleteMessage,
    markConversationRead,
    acceptConversation,
  } = useChat(conversationId, currentUserId, recipient.id);

  const { deduct, canAfford } = useGiftCoins();

  const [inputText,   setInputText]   = useState('');
  const [showMenu,    setShowMenu]     = useState(false);
  const [showReport,  setShowReport]   = useState(false);
  const [longPressId, setLongPressId]  = useState<string | null>(null);
  const [sendingVoice, setSendingVoice] = useState(false);

  const [recipientStatus, setRecipientStatus] =
    useState<'online' | 'offline' | 'typing'>('offline');

  const scrollRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const pressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFemale = recipient.gender === 'female';

  // ── Presence ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel(`presence_${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const other = (Object.values(state).flat() as any[])
          .find(u => u.user_id === recipient.id);
        if (other?.typing)  setRecipientStatus('typing');
        else if (other)     setRecipientStatus('online');
        else                setRecipientStatus('offline');
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, typing: false });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, recipient.id, currentUserId]);

  // ── Auto Read ─────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) markConversationRead();
  }, [messages.length]);

  // ── Auto Scroll ───────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── إرسال نص ─────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    // هل نحتاج خصم نقاط؟
    const needsCoins = !convStatus.is_free && !convStatus.is_unlocked;

    if (needsCoins) {
      if (!canAfford('message')) return; // useGiftCoins يعرض toast
      const ok = await deduct({ action: 'message', target_id: recipient.id });
      if (!ok) return;
    }

    const sent = await sendMessage(text);
    if (sent) {
      setInputText('');
      setTyping(false);
      inputRef.current?.blur();
    }
  };

  // ── إرسال صوت ────────────────────────────────────────────────
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

  // ── Typing ───────────────────────────────────────────────────
  const handleChange = (val: string) => {
    setInputText(val);
    setTyping(val.length > 0);
  };

  // ── Long Press (حذف رسالتك) ───────────────────────────────────
  const handleTouchStart = (msgId: string) => {
    pressTimer.current = setTimeout(() => setLongPressId(msgId), 500);
  };
  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  // ── Block ────────────────────────────────────────────────────
  const handleBlock = async () => {
    setShowMenu(false);
    await supabase.from('likes').upsert(
      { from_user: currentUserId, to_user: recipient.id, action: 'block' },
      { onConflict: 'from_user,to_user,action' }
    );
    onBlock?.();
    onBack();
  };

  // ── Status ───────────────────────────────────────────────────
  const statusText =
    recipientStatus === 'typing'
      ? isFemale ? 'تكتب الآن...'  : 'يكتب الآن...'
      : recipientStatus === 'online'
      ? isFemale ? 'متصلة الآن'    : 'متصل الآن'
      : recipient.last_seen
      ? `${formatDistanceToNow(new Date(recipient.last_seen), { addSuffix: true, locale: ar })}`
      : isFemale ? 'غير متصلة'     : 'غير متصل';

  const statusColor =
    recipientStatus === 'online'  ? '#22c55e'
    : recipientStatus === 'typing' ? 'var(--color-gold-hover)'
    : 'var(--text-tertiary)';

  // ── هل يمكن الإرسال؟ ─────────────────────────────────────────
  const canSend = convStatus.is_free || convStatus.is_unlocked || !convStatus.pending_unlock;

  // ── هل نُظهر بانر القبول للمستقبل؟ ──────────────────────────
  const showAcceptBanner =
    !convStatus.is_unlocked &&
    !convStatus.is_free &&
    !convStatus.pending_unlock &&
    messages.some(m => m.sender_id === recipient.id); // الطرف الآخر أرسل أول رسالة

  // ── هل نُظهر بانر الانتظار للمرسل؟ ──────────────────────────
  const showWaitBanner = convStatus.pending_unlock;

  // ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <div
        dir="rtl"
        style={{
          height:        64,
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          padding:       '0 12px',
          gap:           8,
          background:    'var(--bg-surface)',
          borderBottom:  '1px solid var(--glass-border)',
          flexShrink:    0,
          position:      'sticky',
          top:           0,
          zIndex:        50,
        }}
      >

        {/* ثلاث نقاط — يسار (RTL → يظهر على اليسار) */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowMenu(v => !v)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 8, color: 'var(--text-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MoreVertical size={20} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: -8 }}
                  animate={{ opacity: 1, scale: 1,    y: 0  }}
                  exit={{   opacity: 0, scale: 0.88, y: -8  }}
                  transition={{ duration: 0.15 }}
                  dir="rtl"
                  style={{
                    position:     'absolute',
                    top:          46,
                    right:        0,
                    zIndex:       20,
                    background:   'var(--bg-elevated)',
                    border:       '1px solid var(--glass-border)',
                    borderRadius: 16,
                    overflow:     'hidden',
                    width:        160,
                    boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* بلاغ فقط — الحظر لوحده */}
                  {[
                    {
                      label: 'إبلاغ',
                      icon:  null,
                      color: '#f87171',
                      action: () => { setShowMenu(false); setShowReport(true); },
                    },
                    {
                      label: 'حظر',
                      icon:  <ShieldOff size={14} />,
                      color: '#fb923c',
                      action: handleBlock,
                    },
                  ].map((item, i) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      style={{
                        width: '100%', padding: '13px 14px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        borderBottom: i === 0 ? '1px solid var(--glass-border)' : 'none',
                        color: item.color, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* الأفاتار + الاسم + الحالة — يضغط لفتح الملف */}
        <button
          onClick={() => onOpenProfile?.(recipient.id)}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        10,
            background: 'transparent',
            border:     'none',
            cursor:     'pointer',
            flex:       1,
            minWidth:   0,
            textAlign:  'right',
          }}
        >
          {/* الأفاتار مع OnlineDot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width:        42,
              height:       42,
              borderRadius: '50%',
              overflow:     'hidden',
              border:       '1.5px solid var(--glass-border)',
              background:   'var(--glass-bg)',
            }}>
              <img
                src={recipient.avatar || '/default-avatar.png'}
                alt=""
                style={{
                  width:      '100%',
                  height:     '100%',
                  objectFit:  'cover',
                  display:    'block',
                  filter:     recipient.is_photos_blurred ? 'blur(8px)'   : 'none',
                  transform:  recipient.is_photos_blurred ? 'scale(1.15)' : 'none',
                }}
              />
            </div>
            <OnlineDot
              userId={recipient.id}
              initialLastActive={recipient.last_seen}
              size={12}
            />
          </div>

          {/* اسم + حالة */}
          <div style={{ minWidth: 0 }}>
            <span style={{
              color:       'var(--text-main)',
              fontWeight:  700,
              fontSize:    14,
              display:     'block',
              overflow:    'hidden',
              textOverflow:'ellipsis',
              whiteSpace:  'nowrap',
            }}>
              {recipient.name}
            </span>
            <span style={{ fontSize: 11, color: statusColor, display: 'block' }}>
              {statusText}
            </span>
          </div>
        </button>

        {/* سهم الرجوع */}
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 8, color: 'var(--text-main)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowRight size={22} />
        </button>
      </div>

      {/* ══════════════════════════════════════
          بانر قبول المحادثة (للمستقبل)
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {showAcceptBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -12 }}
            dir="rtl"
            style={{
              background:   'rgba(164,22,26,0.12)',
              borderBottom: '1px solid var(--border-soft)',
              padding:      '10px 16px',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'space-between',
              gap:          12,
              flexShrink:   0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={16} color="var(--color-primary)" />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                هل تريد قبول هذه المحادثة؟
              </span>
            </div>
            <button
              onClick={acceptConversation}
              style={{
                padding:      '5px 16px',
                borderRadius: 20,
                background:   'var(--color-accent)',
                border:       'none',
                color:        '#fff',
                fontSize:     12,
                fontWeight:   700,
                cursor:       'pointer',
                flexShrink:   0,
              }}
            >
              قبول
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          بانر انتظار الرد (للمرسل)
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {showWaitBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -12 }}
            dir="rtl"
            style={{
              background:   'rgba(234,179,8,0.08)',
              borderBottom: '1px solid rgba(234,179,8,0.2)',
              padding:      '8px 16px',
              display:      'flex',
              alignItems:   'center',
              gap:          8,
              flexShrink:   0,
            }}
          >
            <Clock size={14} color="#ca8a04" />
            <span style={{ fontSize: 11, color: '#ca8a04' }}>
              في انتظار رد {isFemale ? 'الطرف الأخرى' : 'الطرف الآخر'} — لا يمكن إرسال رسائل أخرى حتى ذلك الحين
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          MESSAGES
      ══════════════════════════════════════ */}
      <div style={{
        flex:          1,
        overflowY:     'auto',
        padding:       '16px 14px',
        display:       'flex',
        flexDirection: 'column',
        gap:           8,
      }}>
        {loading ? (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            flex:1, color:'var(--text-tertiary)',
          }}>
            جارٍ التحميل...
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === currentUserId;

            // ── ألوان الفقاعة ───────────────────────────────
            const bgMine    = 'var(--color-accent)';          // أحمر غامق — رسائلي
            const bgTheirs  = 'var(--bg-elevated)';           // سطح مرتفع — رسائله/رسائلها
            const borderMine   = 'rgba(164,22,26,0.5)';
            const borderTheirs = 'var(--glass-border)';

            return (
              <div
                key={msg.id}
                dir="rtl"
                style={{
                  display:        'flex',
                  justifyContent: isMine ? 'flex-start' : 'flex-end',
                }}
                onTouchStart={() => isMine && handleTouchStart(msg.id)}
                onTouchEnd={handleTouchEnd}
              >
                <div style={{
                  maxWidth:                '78%',
                  position:                'relative',
                  padding:                 '10px 14px',
                  borderRadius:            18,
                  borderBottomRightRadius: isMine ? 4  : 18,
                  borderBottomLeftRadius:  isMine ? 18 : 4,
                  background:              isMine ? bgMine   : bgTheirs,
                  border:                  `1px solid ${isMine ? borderMine : borderTheirs}`,
                  opacity:                 msg.is_optimistic ? 0.75 : 1,
                }}>

                  {/* محتوى الرسالة */}
                  {msg.message_type === 'voice' && msg.audio_url ? (
                    <VoiceMessageBubble
                      audioUrl={msg.audio_url}
                      isMine={isMine}
                    />
                  ) : (
                    <p style={{
                      margin:     0,
                      fontSize:   14,
                      lineHeight: 1.55,
                      color:      isMine ? '#ffffff' : 'var(--text-main)',
                    }}>
                      {msg.content}
                    </p>
                  )}

                  {/* وقت + قُرئ */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    marginTop: 4, opacity: 0.65,
                  }}>
                    {isMine && (
                      <CheckCheck
                        size={12}
                        style={{ color: msg.is_read ? '#4fc3f7' : (isMine ? 'rgba(255,255,255,0.5)' : 'var(--text-tertiary)') }}
                      />
                    )}
                    <span style={{
                      fontSize: 10,
                      color:    isMine ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)',
                    }}>
                      {msgTime(msg.created_at)}
                    </span>
                    {msg.failed && (
                      <span style={{ fontSize: 9, color: '#f87171' }}>!</span>
                    )}
                  </div>

                  {/* زر حذف (long press) */}
                  <AnimatePresence>
                    {isMine && longPressId === msg.id && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{   opacity: 0, scale: 0.7 }}
                        onClick={() => { deleteMessage(msg.id); setLongPressId(null); }}
                        style={{
                          position:      'absolute',
                          top:           -12,
                          right:         -10,
                          width:         28,
                          height:        28,
                          borderRadius:  '50%',
                          background:    '#f87171',
                          border:        'none',
                          cursor:        'pointer',
                          display:       'flex',
                          alignItems:    'center',
                          justifyContent:'center',
                        }}
                      >
                        <Trash2 size={12} color="#fff" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* ══════════════════════════════════════
          INPUT
      ══════════════════════════════════════ */}
      <div
        dir="rtl"
        style={{
          padding:    '10px 14px 24px',
          background: 'var(--bg-surface)',
          borderTop:  '1px solid var(--glass-border)',
        }}
      >
        {/* إذا كان في انتظار رد → حقل معطّل مع رسالة */}
        {showWaitBanner ? (
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            height:         48,
            borderRadius:   30,
            background:     'var(--glass-bg)',
            border:         '1px solid var(--glass-border)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              في انتظار رد الطرف الآخر...
            </span>
          </div>
        ) : (
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        8,
            background: 'var(--glass-bg)',
            border:     '1px solid var(--glass-border)',
            borderRadius: 30,
            padding:    '4px',
          }}>

            {/* زر الإرسال */}
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={handleSend}
              style={{
                width:          40,
                height:         40,
                borderRadius:   '50%',
                flexShrink:     0,
                background:     inputText.trim()
                  ? 'var(--color-accent)'
                  : 'rgba(255,255,255,0.06)',
                border:         'none',
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}
            >
              <Send
                size={16}
                color={inputText.trim() ? '#fff' : 'var(--text-tertiary)'}
              />
            </motion.button>

            {/* حقل النص */}
            <input
              ref={inputRef}
              type="text"
              dir="rtl"
              placeholder={
                !convStatus.is_free && !convStatus.is_unlocked
                  ? 'إرسال أول رسالة يكلف 10 نقاط'
                  : 'اكتب رسالتك...'
              }
              value={inputText}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{
                flex:       1,
                background: 'transparent',
                border:     'none',
                color:      'var(--text-main)',
                fontSize:   14,
                outline:    'none',
                fontFamily: 'inherit',
                padding:    '0 10px',
              }}
            />

            {/* مسجّل الصوت */}
            <VoiceRecorder
              onSend={handleVoiceSend}
              disabled={sendingVoice || showWaitBanner}
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          ReportSheet
      ══════════════════════════════════════ */}
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