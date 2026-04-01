'use client';
/**
 * 📁 app/notifications/page.tsx
 * ZAWAJ AI — الإشعارات
 * ✅ أفاتار دائري + أيقونة النوع + اسم + نبذة + وقت
 * ✅ ProfileModal بدل sessionStorage + router.push
 */

import { useNotifications } from '@/hooks/useNotifications';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Eye, MessageCircle,
  Handshake, Sparkles, Bell,
} from 'lucide-react';
import { supabase }  from '@/lib/supabase/client';
import ProfileModal  from '@/components/profile/ProfileModal';

// ── الوقت النسبي ──────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return 'الآن';
  const m = Math.floor(s / 60);
  if (m === 1)  return 'منذ دقيقة';
  if (m === 2)  return 'منذ دقيقتين';
  if (m < 60)   return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h === 1)  return 'منذ ساعة';
  if (h === 2)  return 'منذ ساعتين';
  if (h < 24)   return `منذ ${h} ساعات`;
  const d = Math.floor(h / 24);
  if (d === 1)  return 'منذ يوم';
  if (d === 2)  return 'منذ يومين';
  if (d < 30)   return `منذ ${d} أيام`;
  const mo = Math.floor(d / 30);
  if (mo === 1) return 'منذ شهر';
  if (mo < 12)  return `منذ ${mo} أشهر`;
  return 'منذ أكثر من سنة';
}

// ── أنواع الإشعارات ───────────────────────────────────────────
type NotifType = 'like' | 'match' | 'view' | 'message' | 'mediator' | 'system';

interface Sender {
  id: string;
  full_name: string;
  avatar_url: string;
  is_photos_blurred: boolean;
}

interface Notif {
  notification_id: string;
  type: NotifType;
  title: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  from_user: string | null;
  sender: Sender | null;
}

// ── إعداد كل نوع ─────────────────────────────────────────────
const NOTIF_CFG: Record<NotifType, {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  defaultText: (name: string) => string;
}> = {
  like: {
    icon: <Heart size={11} fill="white" strokeWidth={0} />,
    iconColor: '#fff',
    iconBg: '#a4161a',
    borderColor: 'rgba(164,22,26,0.7)',
    defaultText: n => `${n} أعجب بملفك`,
  },
  match: {
    icon: <Sparkles size={11} />,
    iconColor: '#fff',
    iconBg: 'linear-gradient(135deg,#f472b6,#a855f7)',
    borderColor: '#f472b6',
    defaultText: n => `تطابقتما! أنت و${n}`,
  },
  view: {
    icon: <Eye size={11} />,
    iconColor: '#000',
    iconBg: '#d4af37',
    borderColor: 'rgba(212,175,55,0.7)',
    defaultText: n => `${n} زار ملفك`,
  },
  message: {
    icon: <MessageCircle size={11} />,
    iconColor: '#fff',
    iconBg: 'rgba(56,189,248,0.9)',
    borderColor: 'rgba(56,189,248,0.6)',
    defaultText: n => `${n} أرسل لك رسالة`,
  },
  mediator: {
    icon: <Handshake size={11} />,
    iconColor: '#000',
    iconBg: 'linear-gradient(135deg,#d4af37,#f9e29d)',
    borderColor: 'rgba(212,175,55,0.7)',
    defaultText: n => `الوسيط ${n} تواصل معك`,
  },
  system: {
    icon: <Bell size={11} />,
    iconColor: '#fff',
    iconBg: 'rgba(255,255,255,0.2)',
    borderColor: 'var(--glass-border)',
    defaultText: () => 'إشعار من النظام',
  },
};

// ══════════════════════════════════════════════════════════════
//  بطاقة إشعار واحدة
// ══════════════════════════════════════════════════════════════
function NotifCard({ n, onRead, onPress }: {
  n: Notif;
  onRead: (id: string) => void;
  onPress: (fromUser: string) => void;
}) {
  const cfg        = NOTIF_CFG[n.type] ?? NOTIF_CFG.system;
  const senderName = n.sender?.full_name ?? 'مستخدم';
  const blurred    = n.sender?.is_photos_blurred ?? false;
  const notifText  = n.message ?? n.title ?? cfg.defaultText(senderName);

  const handleClick = () => {
    if (!n.is_read) onRead(n.notification_id);
    if (n.from_user) onPress(n.from_user);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileTap={{ scale: 0.982 }}
      onClick={handleClick}
      dir="rtl"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 16px',
        borderBottom: '1px solid var(--glass-border)',
        cursor: 'pointer',
        background: n.is_read ? 'transparent' : 'rgba(212,175,55,0.04)',
        transition: 'background 0.2s',
      }}
    >
      {/* ── الأفاتار + أيقونة النوع ──────────────────────── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>

        {/* الأفاتار الدائري */}
        <div style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--glass-bg)',
          border: `2px solid ${n.is_read ? 'var(--glass-border)' : cfg.borderColor}`,
          boxShadow: n.is_read ? 'none' : `0 0 10px ${cfg.borderColor}55`,
        }}>
          <img
            src={n.sender?.avatar_url || '/default-avatar.png'}
            alt=""
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: blurred ? 'blur(10px)' : 'none',
              transform: blurred ? 'scale(1.15)' : 'none',
            }}
          />
        </div>

        {/* أيقونة نوع الإشعار — أسفل يسار الأفاتار */}
        <div style={{
          position: 'absolute',
          bottom: -2,
          left: -2,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: cfg.iconBg,
          border: '2px solid var(--bg-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: cfg.iconColor,
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        }}>
          {cfg.icon}
        </div>
      </div>

      {/* ── النص ─────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* الاسم */}
        <span style={{
          color: 'var(--text-main)',
          fontSize: 'calc(var(--base-font-size) * 0.85)',
          fontWeight: n.is_read ? 500 : 700,
          display: 'block',
          marginBottom: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {senderName}
        </span>

        {/* نص الإشعار */}
        <p style={{
          color: n.is_read ? 'var(--text-tertiary)' : 'var(--text-secondary)',
          fontSize: 'calc(var(--base-font-size) * 0.76)',
          fontWeight: 400,
          margin: 0,
          lineHeight: 1.45,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as any,
        }}>
          {notifText}
        </p>

        {/* الوقت */}
        <span style={{
          color: 'rgba(255,255,255,0.28)',
          fontSize: 'calc(var(--base-font-size) * 0.68)',
          marginTop: 3,
          display: 'block',
        }}>
          {timeAgo(n.created_at)}
        </span>
      </div>

      {/* نقطة غير مقروء */}
      {!n.is_read && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            flexShrink: 0,
            boxShadow: '0 0 6px rgba(164,22,26,0.6)',
          }}
        />
      )}
    </motion.div>
  );
}



// ══════════════════════════════════════════════════════════════
//  الصفحة الرئيسية
// ══════════════════════════════════════════════════════════════
export default function NotificationsPage() {
  const [notifs,    setNotifs]    = useState<Notif[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // ── هوية المستخدم ─────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // ── جلب الإشعارات ─────────────────────────────────────────
  const load = useCallback(async () => {
    if (!userId) return;

    const { data: notifData, error } = await supabase
      .from('notifications')
      .select('notification_id, type, title, message, is_read, created_at, from_user')
      .eq('id', userId)
      .order('created_at', { ascending: false })
      .limit(80);

    if (error) { console.error('[notif]', error.message); setLoading(false); return; }
    if (!notifData?.length) { setNotifs([]); setLoading(false); return; }

    // جلب بيانات المُرسِلين — فقط أعمدة موجودة في profiles
    const ids = [...new Set(notifData.map((r: any) => r.from_user).filter(Boolean))];
    const { data: profiles } = ids.length
      ? await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, is_photos_blurred')
          .in('id', ids)
      : { data: [] };

    const map = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

    setNotifs(notifData.map((r: any) => ({
      ...r,
      type: (r.type as NotifType) ?? (
        r.title?.includes('تطابق') ? 'match'   :
        r.title?.includes('زيار')  ? 'view'    :
        r.title?.includes('رسال')  ? 'message' : 'like'
      ),
      sender: map[r.from_user] ?? null,
    })));
    setLoading(false);
  }, [userId]);

  // ── Realtime ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    load();
    const ch = supabase
      .channel('notifs_rt')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `id=eq.${userId}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, load]);

  // ── تحديد كمقروء ─────────────────────────────────────────
  const markRead = useCallback(async (notification_id: string) => {
    setNotifs(prev =>
      prev.map(n => n.notification_id === notification_id ? { ...n, is_read: true } : n)
    );
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('notification_id', notification_id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    if (!userId) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', userId)
      .eq('is_read', false);
  }, [userId]);

  // ── فتح ProfileModal ──────────────────────────────────────
  const goToProfile = useCallback((fromUser: string) => {
    if (!fromUser || fromUser === userId) return;
    setProfileId(fromUser);
  }, [userId]);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  // ── شاشة التحميل ─────────────────────────────────────────
  if (!userId || loading) return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-main)',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '2.5px solid var(--color-accent)',
          borderTopColor: 'transparent',
        }}
      />
    </div>
  );

  return (
    <>
      <div
        style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg-main)' }}
        dir="rtl"
      >
        {/* ── رأس الصفحة ────────────────────────────────── */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: '18px 20px 12px',
          background: 'var(--bg-main)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{
              color: 'var(--text-main)',
              margin: 0,
              fontSize: 'calc(var(--base-font-size) * 1.4)',
              fontWeight: 900,
            }}>
              الإشعارات
            </h1>
            {unreadCount > 0 && (
              <p style={{
                color: 'var(--text-tertiary)',
                margin: 0,
                fontSize: 'calc(var(--base-font-size) * 0.72)',
              }}>
                {unreadCount} غير {unreadCount === 1 ? 'مقروء' : 'مقروءة'}
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={markAllRead}
              style={{
                padding: '6px 14px',
                borderRadius: 12,
                fontWeight: 700,
                background: 'var(--color-primary-xsoft)',
                color: 'var(--color-primary)',
                fontSize: 'calc(var(--base-font-size) * 0.75)',
                border: '1px solid rgba(212,175,55,0.25)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              قراءة الكل
            </motion.button>
          )}
        </div>

        {/* ── القائمة ───────────────────────────────────── */}
        {notifs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '100px 0',
              gap: 14,
            }}
          >
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-primary-xsoft)',
              border: '1px solid var(--glass-border)',
            }}>
              <Bell size={26} style={{ color: 'var(--color-accent)' }} />
            </div>
            <p style={{
              color: 'var(--text-tertiary)',
              margin: 0,
              fontWeight: 600,
              fontSize: 'calc(var(--base-font-size) * 0.9)',
            }}>
              لا توجد إشعارات بعد
            </p>
          </motion.div>
        ) : (
          <div style={{
            margin: '16px 16px 0',
            borderRadius: 24,
            overflow: 'hidden',
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-surface)',
          }}>
            <AnimatePresence initial={false}>
              {notifs.map(n => (
                <NotifCard
                  key={n.notification_id}
                  n={n}
                  onRead={markRead}
                  onPress={goToProfile}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ══ ProfileModal ════════════════════════════════════ */}
      <AnimatePresence>
        {profileId && (
          <ProfileModal
            userId={profileId}
            currentUser={userId ? { id: userId } : null}
            onClose={() => setProfileId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}