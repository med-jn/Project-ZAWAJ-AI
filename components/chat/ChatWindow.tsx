'use client';
/**
 * 📁 components/chat/ChatWindow.tsx
 * ZAWAJ AI — نافذة الدردشة
 * ✅ توقيت الرسائل بصيغة "منذ كذا"
 * ✅ حالة التواجد مؤنثة/مذكرة حسب gender
 * ✅ تضبيب صورة المستقبِل
 * ✅ إخفاء شريط التنقل العلوي والسفلي عند الفتح
 * ✅ ثلاث نقاط يمين، سهم الرجوع يسار
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence }      from 'framer-motion';
import { formatDistanceToNow }          from 'date-fns';
import { ar }                           from 'date-fns/locale';
import {
  ArrowRight, MoreVertical, Send, CheckCheck,
  Trash2, Flag, ShieldOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useChat }  from '@/hooks/useChat';

// ── توقيت نسبي للرسائل ───────────────────────────────────────
function msgTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return 'الآن';
  const m = Math.floor(s / 60);
  if (m < 60)   return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `منذ ${h} س`;
  return new Date(dateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}

// ─────────────────────────────────────────────────────────────
interface Recipient {
  id:                string;
  name:              string;
  avatar:            string;
  role:              string;
  gender?:           string;       // 'male' | 'female'
  last_seen?:        string;
  is_photos_blurred?: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId:  string;
  recipient:      Recipient;
  onBack:         () => void;
  onOpenProfile?: (userId: string) => void;
  onBlock?:       () => void;
}

// ─────────────────────────────────────────────────────────────
export default function ChatWindow({
  conversationId, currentUserId, recipient,
  onBack, onOpenProfile, onBlock,
}: ChatWindowProps) {

  const {
    messages, loading,
    sendMessage, setTyping,
    deleteMessage, markConversationRead,
  } = useChat(conversationId, currentUserId);

  const [inputText,       setInputText]       = useState('');
  const [showMenu,        setShowMenu]        = useState(false);
  const [recipientStatus, setRecipientStatus] = useState<'online'|'offline'|'typing'>('offline');
  const [longPressId,     setLongPressId]     = useState<string | null>(null);
  const [tick,            setTick]            = useState(0); // لتحديث التوقيت

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFemale = recipient.gender === 'female';

  // ── إخفاء شريط التنقل العلوي والسفلي ─────────────────────
  useEffect(() => {
    // أضف class على body لإخفاء الأشرطة
    document.body.classList.add('chat-open');
    return () => {
      document.body.classList.remove('chat-open');
    };
  }, []);

  // ── تحديث التوقيت كل دقيقة ───────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // ── زر الرجوع في الأندرويد ────────────────────────────────
  useEffect(() => {
    window.history.pushState({ zawajChat: true }, '', window.location.href);
    const handlePop = (e: PopStateEvent) => {
      if (!e.state?.zawajChat) onBack();
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [onBack]);

  // ── منع النسخ ─────────────────────────────────────────────
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('copy', prevent);
    document.addEventListener('contextmenu', prevent);
    (document.body.style as any).userSelect       = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    return () => {
      document.removeEventListener('copy', prevent);
      document.removeEventListener('contextmenu', prevent);
      (document.body.style as any).userSelect       = 'auto';
      (document.body.style as any).webkitUserSelect = 'auto';
    };
  }, []);

  // ── Presence ──────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel(`presence_${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as any[];
        const other = users.find(u => u.user_id === recipient.id);
        if      (other?.typing) setRecipientStatus('typing');
        else if (other)         setRecipientStatus('online');
        else                    setRecipientStatus('offline');
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, typing: false });
        }
      });
    return () => {
      supabase.from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', currentUserId);
      supabase.removeChannel(channel);
    };
  }, [conversationId, recipient.id, currentUserId]);

  // ── قراءة تلقائية ─────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) markConversationRead();
  }, [messages.length]);

  // ── سكرول تلقائي ─────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, recipientStatus]);

  // ── الإرسال ───────────────────────────────────────────────
  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    sendMessage(text);
    setInputText('');
    setTyping(false);
    // لا نُعيد التركيز على الهاتف — يفتح الكيبورد من جديد
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) {
      inputRef.current?.blur();
    }
  };

  const handleChange = (val: string) => {
    setInputText(val);
    setTyping(val.length > 0);
  };

  // ── ضغط مطوّل ─────────────────────────────────────────────
  const handleTouchStart = (msgId: string) => {
    pressTimer.current = setTimeout(() => setLongPressId(msgId), 500);
  };
  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  // ── إبلاغ ─────────────────────────────────────────────────
  const handleReport = async () => {
    setShowMenu(false);
    await supabase.from('reports').insert({
      reporter_id: currentUserId,
      reported_id: recipient.id,
      reason: 'بلاغ من المحادثة',
      status: 'pending',
    });
  };

  // ── حظر ───────────────────────────────────────────────────
  const handleBlock = async () => {
    setShowMenu(false);
    await supabase.from('likes').upsert(
      { from_user: currentUserId, to_user: recipient.id, action: 'block' },
      { onConflict: 'from_user,to_user,action' }
    );
    onBlock?.();
    onBack();
  };

  // ── نص حالة التواجد (مؤنث/مذكر) ─────────────────────────
  const statusText =
    recipientStatus === 'typing'
      ? (isFemale ? 'تكتب الآن...' : 'يكتب الآن...')
    : recipientStatus === 'online'
      ? (isFemale ? 'متصلة الآن'  : 'متصل الآن')
    : recipient.last_seen
      ? `آخر ظهور ${formatDistanceToNow(new Date(recipient.last_seen), { addSuffix: true, locale: ar })}`
      : (isFemale ? 'غير متصلة'   : 'غير متصل');

  const statusColor =
    recipientStatus === 'online'  ? '#22c55e'           :
    recipientStatus === 'typing'  ? 'var(--color-gold)' :
    'rgba(255,255,255,0.38)';

  // ─────────────────────────────────────────────────────────
  return (
    <>
      {/*
        CSS مضمّن لإخفاء الأشرطة.
        يعتمد على class="chat-open" على body تُضاف/تُزال بالـ useEffect أعلاه.
        عدّل selectors حسب بنية مشروعك.
      */}
      <style>{`
        body.chat-open [data-bottom-nav],
        body.chat-open nav,
        body.chat-open header:not(.chat-header) {
          display: none !important;
        }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 6000,
        background: 'var(--bg-main)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ══ Header ════════════════════════════════════════ */}
        <div
          className="chat-header"
          dir="rtl"
          style={{
            height: 64,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px', gap: 8,
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--glass-border)',
            flexShrink: 0,
          }}
        >
          {/* ① يمين: ثلاث نقاط ──────────────────────────── */}
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
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.88, y: -8 }}
                    transition={{ duration: 0.15 }}
                    dir="rtl"
                    style={{
                      position: 'absolute', top: 46, right: 0, zIndex: 20,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 16, overflow: 'hidden', width: 160,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    {[
                      { label: 'إبلاغ', icon: <Flag size={14}/>,     color: '#f87171', action: handleReport },
                      { label: 'حظر',   icon: <ShieldOff size={14}/>, color: '#fb923c', action: handleBlock  },
                    ].map((item, i) => (
                      <button key={item.label} onClick={item.action} style={{
                        width: '100%', padding: '13px 14px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        borderBottom: i === 0 ? '1px solid var(--glass-border)' : 'none',
                        color: item.color, fontFamily: 'inherit',
                        fontSize: 13, fontWeight: 600,
                      }}>
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* ② وسط: صورة + اسم + حالة ───────────────────── */}
          <button
            onClick={() => onOpenProfile?.(recipient.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'transparent', border: 'none', cursor: 'pointer',
              flex: 1, minWidth: 0, textAlign: 'right',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
              border: '1.5px solid var(--glass-border)', flexShrink: 0,
              background: 'var(--glass-bg)',
            }}>
              <img
                src={recipient.avatar || '/default-avatar.png'}
                alt=""
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  filter:    recipient.is_photos_blurred ? 'blur(8px)'   : 'none',
                  transform: recipient.is_photos_blurred ? 'scale(1.15)' : 'none',
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  color: 'var(--text-main)', fontWeight: 700, fontSize: 14,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {recipient.name}
                </span>
                {recipient.role === 'mediator' && (
                  <span style={{
                    background: 'linear-gradient(45deg,#d4af37,#f9e29d)',
                    color: '#000', fontSize: 9, padding: '1px 5px',
                    borderRadius: 4, fontWeight: 800, flexShrink: 0,
                  }}>وسيط</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: statusColor, display: 'block', lineHeight: 1.3 }}>
                {statusText}
              </span>
            </div>
          </button>

          {/* ③ يسار: سهم الرجوع ──────────────────────────── */}
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

        {/* ══ منطقة الرسائل ════════════════════════════════ */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex', flexDirection: 'column', gap: 8,
          scrollbarWidth: 'none',
        }}>
          {loading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flex: 1, color: 'var(--text-tertiary)', fontSize: 13,
            }}>
              جارٍ التحميل...
            </div>
          ) : (
            messages.map(msg => {
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
                    padding: '10px 14px', borderRadius: 18,
                    borderBottomRightRadius: isMine ? 4 : 18,
                    borderBottomLeftRadius:  isMine ? 18 : 4,
                    background: isMine ? 'rgba(164,22,26,0.35)' : 'var(--glass-bg)',
                    border: `1px solid ${isMine ? 'rgba(164,22,26,0.3)' : 'var(--glass-border)'}`,
                    opacity: msg.is_optimistic ? 0.65 : 1,
                    transition: 'opacity 0.25s',
                  }}>
                    <p style={{
                      margin: 0, fontSize: 14, lineHeight: 1.55, direction: 'rtl',
                      color: msg.failed ? '#f87171' : 'var(--text-main)',
                    }}>
                      {msg.content}
                    </p>

                    {/* الوقت + القراءة */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: isMine ? 'flex-start' : 'flex-end',
                      gap: 4, marginTop: 4, opacity: 0.5,
                    }}>
                      {isMine && (
                        <CheckCheck
                          size={12}
                          style={{ color: msg.is_read ? '#4fc3f7' : 'var(--text-tertiary)' }}
                        />
                      )}
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                        {msg.failed ? '✗ فشل' : msgTime(msg.created_at)}
                      </span>
                    </div>

                    {/* حذف بضغط مطوّل */}
                    <AnimatePresence>
                      {isMine && longPressId === msg.id && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          onClick={() => { deleteMessage(msg.id); setLongPressId(null); }}
                          style={{
                            position: 'absolute', top: -12, right: -10,
                            width: 28, height: 28, borderRadius: '50%',
                            background: '#f87171', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
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

          {/* مؤشر الكتابة */}
          <AnimatePresence>
            {recipientStatus === 'typing' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                dir="rtl"
                style={{ display: 'flex', gap: 5, padding: '6px 14px', alignItems: 'center' }}
              >
                {[0,1,2].map(i => (
                  <motion.div key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                    style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-gold)' }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollRef} />
        </div>

        {/* ══ شريط الكتابة ══════════════════════════════════ */}
        <div dir="rtl" style={{
          padding: '10px 14px 24px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--glass-border)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 30, padding: '4px',
          }}>
            {/* زر الإرسال — يمين في RTL */}
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={handleSend}
              style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: inputText.trim() ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
                boxShadow: inputText.trim() ? '0 2px 12px rgba(164,22,26,0.4)' : 'none',
              }}
            >
              <Send size={16} color={inputText.trim() ? '#fff' : 'var(--text-tertiary)'} />
            </motion.button>

            {/* حقل الكتابة */}
            <input
              ref={inputRef}
              type="text"
              dir="rtl"
              placeholder="اكتب رسالتك..."
              value={inputText}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: 'var(--text-main)', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', padding: '0 10px',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}