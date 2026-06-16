'use client';
/**
 * 📁 components/chat/ChatWindow.tsx — ZAWAJ AI v3.0
 * ✅ Swipe-to-reply بدون framer drag (لا يعطل الـ scroll)
 * ✅ Reply preview bar + Quote bubble
 * ✅ MessageRow كمكوّن منفصل (يحل مشكلة hooks في loops)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, CheckCheck, Check,
  MoreVertical, ShieldOff, Clock, MessageCircle,
  Trash2, Mic, Reply, X,
} from 'lucide-react';

import { supabase }             from '@/lib/supabase/client';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { useGiftCoins }         from '@/hooks/useGiftCoins';
import OnlineDot                from '@/components/profile/OnlineDot';
import VoiceRecorder            from './VoiceRecorder';
import VoiceMessageBubble       from './VoiceMessageBubble';
import ReportSheet              from '@/components/security/ReportSheet';

/* ═══════════════════════════════════════════════════════════ */
/*  helpers                                                    */
/* ═══════════════════════════════════════════════════════════ */

function msgTime(dateStr: string): string {
  const d    = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const s    = Math.floor(diff / 1000);
  if (s < 60) return 'الآن';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

/* ═══════════════════════════════════════════════════════════ */
/*  TypingBubble                                               */
/* ═══════════════════════════════════════════════════════════ */

function TypingBubble() {
  return (
    <div dir="rtl" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
      <div style={{
        padding: '10px 16px', borderRadius: 18, borderBottomLeftRadius: 4,
        background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {[0,1,2].map(i => (
          <motion.div key={i}
            animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.18, ease: 'easeInOut' }}
            style={{ width:6, height:6, borderRadius:'50%', background:'var(--text-tertiary)' }}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  QuoteBubble                                                */
/* ═══════════════════════════════════════════════════════════ */

function QuoteBubble({ content, type, isMine }: {
  content: string; type: string; isMine: boolean;
}) {
  return (
    <div style={{
      borderRight: `3px solid ${isMine ? 'rgba(255,255,255,0.6)' : 'var(--color-accent)'}`,
      paddingRight: 8, marginBottom: 6, opacity: 0.75,
    }}>
      <p style={{
        margin: 0,
        fontSize: 'var(--chat-quote-size, var(--text-2xs))',
        color: isMine ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {type === 'voice' ? '🎤 رسالة صوتية' : content}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MessageRow — مكوّن رسالة واحدة مع swipe-to-reply          */
/* ═══════════════════════════════════════════════════════════ */

interface MessageRowProps {
  msg:           ChatMessage;
  isMine:        boolean;
  isPressed:     boolean;
  onSwipe:       () => void;
  onPressStart:  () => void;
  onPressEnd:    () => void;
  onDelete:      () => void;
}

function MessageRow({
  msg, isMine, isPressed,
  onSwipe, onPressStart, onPressEnd, onDelete,
}: MessageRowProps) {

  const wrapRef      = useRef<HTMLDivElement>(null);
  const touchStartX  = useRef(0);
  const touchStartY  = useRef(0);
  const swipedRef    = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipedRef.current   = false;
    if (wrapRef.current) wrapRef.current.style.transition = 'none';
    onPressStart();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    // عمودي أكثر = scroll عادي
    if (dy > Math.abs(dx)) return;
    // سحب يمين فقط (dx > 0)
    if (dx > 0 && dx < 70) {
      if (wrapRef.current) wrapRef.current.style.transform = `translateX(${dx}px)`;
      if (dx > 48 && !swipedRef.current) {
        swipedRef.current = true;
        onSwipe();
        if (navigator.vibrate) navigator.vibrate(30);
      }
    }
  };

  const handleTouchEnd = () => {
    if (wrapRef.current) {
      wrapRef.current.style.transition = 'transform 0.25s ease';
      wrapRef.current.style.transform  = 'translateX(0)';
    }
    onPressEnd();
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={onPressStart}
      onMouseUp={onPressEnd}
      onMouseLeave={onPressEnd}
    >
      <div dir="rtl" style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isMine ? 'flex-start' : 'flex-end',
        gap: 2,
      }}>
        {/* فقاعة الرسالة */}
        <div style={{
          maxWidth: '78%', position: 'relative',
          padding: '9px 13px', borderRadius: 18,
          borderBottomRightRadius: isMine ? 4 : 18,
          borderBottomLeftRadius:  isMine ? 18 : 4,
          background: isMine ? '#8B1A1A' : 'var(--bg-elevated)',
          border: `1px solid ${isMine ? 'rgba(139,26,26,0.6)' : 'var(--glass-border)'}`,
          opacity: msg.is_optimistic ? 0.7 : 1,
          transition: 'opacity 0.2s',
          userSelect: 'none', WebkitUserSelect: 'none',
        }}>
          {/* اقتباس */}
          {msg.reply_to_content && (
            <QuoteBubble
              content={msg.reply_to_content}
              type={msg.reply_to_type ?? 'text'}
              isMine={isMine}
            />
          )}

          {/* محتوى */}
          {msg.message_type === 'voice' && msg.audio_url ? (
            <VoiceMessageBubble audioUrl={msg.audio_url} isMine={isMine} messageId={msg.id} />
          ) : msg.message_type === 'voice' ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:120, opacity:0.7 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Mic size={14} color="rgba(255,255,255,0.7)" />
              </div>
              <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ repeat:Infinity, duration:1.2 }}
                style={{ width:60, height:3, borderRadius:2, background:'rgba(255,255,255,0.3)' }} />
            </div>
          ) : (
            <p style={{
              margin: 0,
              fontSize: 'var(--chat-msg-size, var(--text-sm))',
              lineHeight: 1.6,
              color: isMine ? '#ffffff' : 'var(--text-main)',
              wordBreak: 'break-word',
            }}>{msg.content}</p>
          )}

          {/* زر الحذف — long press — رسائلي فقط */}
          <AnimatePresence>
            {isPressed && isMine && (
              <motion.button
                initial={{ opacity:0, scale:0.7 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.7 }}
                onClick={e => { e.stopPropagation(); onDelete(); }}
                style={{
                  position:'absolute', top:-12, right:-10,
                  width:28, height:28, borderRadius:'50%',
                  background:'#f87171', border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >
                <Trash2 size={12} color="#fff" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* وقت + حالة قراءة عند long press */}
        <AnimatePresence>
          {isPressed && (
            <motion.div
              initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
              style={{ display:'flex', alignItems:'center', gap:4, paddingInline:6 }}
            >
              {isMine && (msg.is_read
                ? <CheckCheck size={12} color="#4fc3f7" />
                : <Check      size={12} color="var(--text-tertiary)" />
              )}
              <span style={{ fontSize:10, color:'var(--text-tertiary)' }}>
                {msgTime(msg.created_at)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  ChatWindow                                                 */
/* ═══════════════════════════════════════════════════════════ */

interface Recipient {
  id: string; name: string; avatar: string; role: string;
  gender?: string; last_seen?: string; is_photos_blurred?: boolean;
}
interface Props {
  conversationId: string; currentUserId: string; recipient: Recipient;
  onBack: () => void; onOpenProfile?: (userId: string) => void; onBlock?: () => void;
}

const AVATAR = 40;
const DOT    = 13;

export default function ChatWindow({
  conversationId, currentUserId, recipient,
  onBack, onOpenProfile, onBlock,
}: Props) {

  const {
    messages, loading, convStatus, recipientTyping,
    sendMessage, sendVoiceMessage,
    setTyping, deleteMessage, markConversationRead, acceptConversation,
  } = useChat(conversationId, currentUserId, recipient.id);

  const { deduct, canAfford } = useGiftCoins();

  const [inputText,    setInputText]    = useState('');
  const [showMenu,     setShowMenu]     = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [pressedId,    setPressedId]    = useState<string | null>(null);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [isBlocked,    setIsBlocked]    = useState(false);
  const [replyTo,      setReplyTo]      = useState<{
    id: string; content: string; type: string;
  } | null>(null);

  const scrollRef      = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFemale       = recipient.gender === 'female';

  /* فحص الحظر */
  useEffect(() => {
    if (!currentUserId || !recipient.id) return;
    supabase.from('blocks')
      .select('id')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${recipient.id}),and(blocker_id.eq.${recipient.id},blocked_id.eq.${currentUserId})`)
      .maybeSingle()
      .then(({ data }) => setIsBlocked(!!data));
  }, [currentUserId, recipient.id]);

  useEffect(() => {
    if (messages.length > 0) markConversationRead();
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, recipientTyping]);

  /* إرسال نصي */
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isBlocked) return;
    const needsCoins = !convStatus.is_free && !convStatus.is_unlocked;
    if (needsCoins) {
      if (!canAfford('message')) return;
      const ok = await deduct({ action: 'message', target_id: recipient.id });
      if (!ok) return;
    }
    const sent = await sendMessage(text, replyTo);
    if (sent) { setInputText(''); setTyping(false); setReplyTo(null); inputRef.current?.blur(); }
  };

  /* إرسال صوتي */
  const handleVoiceSend = useCallback(async (blob: Blob) => {
    if (isBlocked) return;
    setSendingVoice(true);
    const needsCoins = !convStatus.is_free && !convStatus.is_unlocked;
    if (needsCoins) {
      if (!canAfford('message')) { setSendingVoice(false); return; }
      const ok = await deduct({ action: 'message', target_id: recipient.id });
      if (!ok) { setSendingVoice(false); return; }
    }
    await sendVoiceMessage(blob, replyTo);
    setReplyTo(null);
    setSendingVoice(false);
  }, [convStatus, canAfford, deduct, recipient.id, sendVoiceMessage, isBlocked, replyTo]);

  const handleChange = (val: string) => { setInputText(val); setTyping(val.length > 0); };

  const handleSwipeReply = (msg: ChatMessage) => {
    setReplyTo({ id: msg.id, content: msg.content || '', type: msg.message_type });
    inputRef.current?.focus();
  };

  const handlePressStart = (msgId: string) => {
    longPressTimer.current = setTimeout(() => setPressedId(msgId), 500);
  };
  const handlePressEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const handleBlock = async () => {
    setShowMenu(false);
    await supabase.from('blocks').upsert(
      { blocker_id: currentUserId, blocked_id: recipient.id },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
    );
    setIsBlocked(true); onBlock?.(); onBack();
  };

  const showAcceptBanner =
    !convStatus.is_unlocked && !convStatus.is_free && !convStatus.pending_unlock &&
    messages.some(m => m.sender_id === recipient.id);
  const showWaitBanner = convStatus.pending_unlock;
  const hasText        = inputText.trim().length > 0;

  return (
    <div
      style={{ position:'fixed', inset:0, background:'var(--bg-main)', display:'flex', flexDirection:'column', zIndex:1000 }}
      onClick={() => pressedId && setPressedId(null)}
    >
      {/* ── HEADER ── */}
      <header dir="rtl" style={{
        position:'fixed', top:0, right:0, left:0, zIndex:1001,
        height:'var(--header-h-safe)',
        display:'flex', alignItems:'flex-end',
        paddingBottom:'8px', paddingLeft:'4px', paddingRight:'4px', gap:4,
        background:'var(--bg-surface)', borderBottom:'1px solid var(--glass-border)',
        backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
      }}>
        <button onClick={() => onOpenProfile?.(recipient.id)} style={{
          flex:1, minWidth:0, display:'flex', alignItems:'center', flexDirection:'row', gap:10,
          background:'transparent', border:'none', cursor:'pointer', padding:'0 4px', textAlign:'right',
        }}>
          <div style={{ position:'relative', width:AVATAR, height:AVATAR, flexShrink:0 }}>
            <div style={{ width:AVATAR, height:AVATAR, borderRadius:'50%', overflow:'hidden', border:'1.5px solid var(--glass-border)', background:'var(--glass-bg)' }}>
              <img src={recipient.avatar || '/default-avatar.png'} alt="" style={{
                width:'100%', height:'100%', objectFit:'cover', display:'block',
                filter:    recipient.is_photos_blurred ? 'blur(8px)'   : 'none',
                transform: recipient.is_photos_blurred ? 'scale(1.15)' : 'none',
                transition:'filter 0.3s',
              }} />
            </div>
            <div style={{ position:'absolute', bottom:-(DOT/2), right:-(DOT/2), width:DOT, height:DOT }}>
              <OnlineDot userId={recipient.id} initialLastActive={recipient.last_seen} size={DOT} />
            </div>
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <span style={{ color:'var(--text-main)', fontWeight:700, fontSize:15, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {recipient.name}
            </span>
            <AnimatePresence mode="wait">
              {recipientTyping && (
                <motion.span key="typing"
                  initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:4 }}
                  style={{ fontSize:11, color:'var(--color-gold-hover)', display:'block' }}
                >
                  {isFemale ? 'تكتب الآن...' : 'يكتب الآن...'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </button>

        <div style={{ position:'relative', flexShrink:0 }}>
          <button onClick={() => setShowMenu(v => !v)} style={{
            background:'transparent', border:'none', cursor:'pointer',
            width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--text-tertiary)',
          }}>
            <MoreVertical size={20} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <>
                <div style={{ position:'fixed', inset:0, zIndex:10 }} onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity:0, scale:0.88, y:-8 }} animate={{ opacity:1, scale:1, y:0 }}
                  exit={{ opacity:0, scale:0.88, y:-8 }} transition={{ duration:0.15 }}
                  dir="rtl" style={{
                    position:'absolute', top:46, left:0, zIndex:20,
                    background:'var(--bg-elevated)', border:'1px solid var(--glass-border)',
                    borderRadius:16, overflow:'hidden', width:150,
                    boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {[
                    { label:'إبلاغ', color:'#f87171', action:() => { setShowMenu(false); setShowReport(true); } },
                    { label:'حظر',   icon:<ShieldOff size={13}/>, color:'#fb923c', action:handleBlock },
                  ].map((item,i) => (
                    <button key={item.label} onClick={item.action} style={{
                      width:'100%', padding:'12px 14px', display:'flex', alignItems:'center', gap:8,
                      background:'transparent', border:'none', cursor:'pointer',
                      borderBottom: i===0 ? '1px solid var(--glass-border)' : 'none',
                      color:item.color, fontFamily:'inherit', fontSize:13, fontWeight:600,
                    }}>
                      {(item as any).icon}{item.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button onClick={onBack} style={{
          background:'transparent', border:'none', cursor:'pointer',
          width:44, height:44, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--text-main)',
        }}>
          <ArrowLeft size={22} />
        </button>
      </header>

      <div style={{ height:'var(--header-h-safe)', flexShrink:0 }} />

      {/* ── بانر قبول ── */}
      <AnimatePresence>
        {showAcceptBanner && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }} dir="rtl"
            style={{ background:'rgba(164,22,26,0.10)', borderBottom:'1px solid var(--border-soft)', padding:'10px 14px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, overflow:'hidden' }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <MessageCircle size={14} color="var(--color-primary)" />
              <span style={{ fontSize:12, color:'var(--text-secondary)' }}>هل تريد قبول هذه المحادثة؟</span>
            </div>
            <button onClick={acceptConversation} style={{ padding:'5px 14px', borderRadius:20, background:'var(--color-accent)', border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
              قبول
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── بانر انتظار ── */}
      <AnimatePresence>
        {showWaitBanner && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }} dir="rtl"
            style={{ background:'rgba(234,179,8,0.08)', borderBottom:'1px solid rgba(234,179,8,0.2)', padding:'8px 14px', flexShrink:0, display:'flex', alignItems:'center', gap:7, overflow:'hidden' }}
          >
            <Clock size={13} color="#ca8a04" />
            <span style={{ fontSize:11, color:'#ca8a04' }}>
              في انتظار رد {isFemale ? 'الطرف الأخرى' : 'الطرف الآخر'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── الرسائل ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 12px 8px', display:'flex', flexDirection:'column', gap:6 }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, color:'var(--text-tertiary)', fontSize:13 }}>
            جارٍ التحميل...
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <MessageRow
                key={msg.id}
                msg={msg}
                isMine={msg.sender_id === currentUserId}
                isPressed={pressedId === msg.id}
                onSwipe={() => handleSwipeReply(msg)}
                onPressStart={() => handlePressStart(msg.id)}
                onPressEnd={handlePressEnd}
                onDelete={() => { deleteMessage(msg.id); setPressedId(null); }}
              />
            ))}

            <AnimatePresence>
              {recipientTyping && (
                <motion.div key="typing-bubble"
                  initial={{ opacity:0, y:8, scale:0.95 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  exit={{    opacity:0, y:8, scale:0.95 }}
                  transition={{ duration:0.2 }}
                >
                  <TypingBubble />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <div ref={scrollRef} />
      </div>

      {/* ── بانر الحظر ── */}
      <AnimatePresence>
        {isBlocked && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ background:'rgba(239,68,68,0.08)', borderTop:'1px solid rgba(239,68,68,0.2)', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          >
            <span style={{ fontSize:12, color:'#ef4444', textAlign:'center' }}>لا يمكنك مراسلة هذا المستخدم</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reply Preview Bar ── */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            dir="rtl" style={{
              background:'var(--bg-elevated)', borderTop:'1px solid var(--glass-border)',
              padding:'8px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0,
            }}
          >
            <Reply size={14} color="var(--color-accent)" style={{ flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{
                margin:0,
                fontSize:'var(--chat-quote-size, var(--text-2xs))',
                color:'var(--text-secondary)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {replyTo.type === 'voice' ? '🎤 رسالة صوتية' : replyTo.content}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)}
              style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, flexShrink:0, color:'var(--text-tertiary)', display:'flex', alignItems:'center' }}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── شريط الإدخال ── */}
      <div dir="rtl" style={{
        padding:'8px 12px',
        paddingBottom:'max(var(--safe-bottom, env(safe-area-inset-bottom, 0px)), 8px)',
        background:'var(--bg-surface)', borderTop:'1px solid var(--glass-border)', flexShrink:0,
      }}>
        {isBlocked ? (
          <div style={{ height:46, borderRadius:30, background:'var(--glass-bg)', border:'1px solid rgba(239,68,68,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:12, color:'#ef4444' }}>المراسلة محظورة</span>
          </div>
        ) : showWaitBanner ? (
          <div style={{ height:46, borderRadius:30, background:'var(--glass-bg)', border:'1px solid var(--glass-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:12, color:'var(--text-tertiary)' }}>في انتظار الطرف الآخر...</span>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:30, padding:'4px' }}>
            <motion.button whileTap={{ scale:0.82 }} onClick={handleSend} style={{
              width:40, height:40, borderRadius:'50%', flexShrink:0,
              background: hasText ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
              border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background 0.2s',
            }}>
              <Send size={15} color={hasText ? '#ffffff' : 'var(--text-tertiary)'} />
            </motion.button>

            <input ref={inputRef} type="text" dir="rtl"
              placeholder="اكتب رسالتك..." value={inputText}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ flex:1, background:'transparent', border:'none', color:'var(--text-main)', fontSize:'var(--chat-input-size, var(--text-sm))', outline:'none', fontFamily:'inherit', padding:'0 8px' }}
            />

            <VoiceRecorder onSend={handleVoiceSend} disabled={sendingVoice || showWaitBanner || isBlocked} />
          </div>
        )}
      </div>

      <ReportSheet open={showReport} onClose={() => setShowReport(false)}
        reportedUserId={recipient.id} targetType="conversation" targetId={conversationId} />
    </div>
  );
}