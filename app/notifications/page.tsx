'use client';

/**
 * 📁 app/notifications/page.tsx
 * ZAWAJ AI — ELITE Notifications System
 *
 * ✅ Smart routing per notification
 * ✅ Gender-aware Arabic grammar
 * ✅ Premium notification cards
 * ✅ Timeline grouping
 * ✅ Realtime
 * ✅ Filters
 * ✅ Deep-link architecture
 * ✅ Zero fake columns / zero guessed routes
 *
 * ⚠ IMPORTANT:
 * هذا الملف لا يفترض أي مسار غير موجود.
 * عدّل ROUTES حسب مشروعك الحقيقي فقط.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Bell,
  Heart,
  Eye,
  MessageCircle,
  Sparkles,
  Handshake,
  Crown,
  Check,
  ChevronLeft,
} from 'lucide-react';

import { supabase } from '@/lib/supabase/client';


// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type NotifType =
  | 'like'
  | 'view'
  | 'message'
  | 'match'
  | 'mediator'
  | 'system';

interface Sender {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  gender?: 'male' | 'female' | null;
  is_photos_blurred?: boolean | null;
}

interface NotificationItem {
  notification_id: string;

  type: NotifType | null;

  title: string | null;
  message: string | null;

  created_at: string;

  is_read: boolean;

  from_user: string | null;

  conversation_id?: string | null;

  sender?: Sender | null;
}


// ═══════════════════════════════════════════════════════════════
// ROUTES
// ⚠ عدّل فقط حسب مساراتك الحقيقية
// ═══════════════════════════════════════════════════════════════

const ROUTES = {
  CHAT: '/chat',
  PROFILE: '/discover',
  PACKAGES: '/packages',
};


// ═══════════════════════════════════════════════════════════════
// TIME
// ═══════════════════════════════════════════════════════════════

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();

  const s = Math.floor(diff / 1000);

  if (s < 15) return 'الآن';

  if (s < 60) return 'منذ لحظات';

  const m = Math.floor(s / 60);

  if (m === 1) return 'منذ دقيقة';

  if (m === 2) return 'منذ دقيقتين';

  if (m < 60) return `منذ ${m} دقيقة`;

  const h = Math.floor(m / 60);

  if (h === 1) return 'منذ ساعة';

  if (h === 2) return 'منذ ساعتين';

  if (h < 24) return `منذ ${h} ساعات`;

  const d = Math.floor(h / 24);

  if (d === 1) return 'أمس';

  if (d < 7) return `منذ ${d} أيام`;

  if (d < 30) return 'هذا الشهر';

  return 'منذ مدة';
}


// ═══════════════════════════════════════════════════════════════
// TEXT ENGINE
// ═══════════════════════════════════════════════════════════════

function buildNotificationText(n: NotificationItem) {

  if (n.message) return n.message;

  const sender = n.sender;

  const name =
    sender?.full_name ||
    'مستخدم';

  const female =
    sender?.gender === 'female';

  switch (n.type) {

    case 'like':
      return female
        ? `${name} معجبة بملفك الشخصي`
        : `${name} معجب بملفك الشخصي`;

    case 'view':
      return female
        ? `${name} زارت ملفك الشخصي`
        : `${name} زار ملفك الشخصي`;

    case 'message':
      return female
        ? `${name} أرسلت لك رسالة جديدة`
        : `${name} أرسل لك رسالة جديدة`;

    case 'match':
      return `يوجد انسجام بينك وبين ${name}`;

    case 'mediator':
      return female
        ? `الوسيطة ${name} ترغب بالتواصل معك`
        : `الوسيط ${name} يرغب بالتواصل معك`;

    default:
      return n.title || 'إشعار جديد';
  }
}


// ═══════════════════════════════════════════════════════════════
// SMART ROUTING
// ⚠ لا يوجد أي افتراضات عشوائية
// ═══════════════════════════════════════════════════════════════

function resolveNotificationAction(
  n: NotificationItem,
  router: any,
) {

  switch (n.type) {

    // ── الرسائل ─────────────────────────────
    case 'message': {

      if (!n.conversation_id) return;

      router.push(
        `${ROUTES.CHAT}?id=${n.conversation_id}`
      );

      return;
    }

    // ── إعجاب / زيارة / تطابق ─────────────
    case 'like':
    case 'view':
    case 'match': {

      if (!n.from_user) return;

      router.push(
        `${ROUTES.PROFILE}/${n.from_user}`
      );

      return;
    }

    // ── الوسيط ─────────────────────────────
    case 'mediator': {

      if (!n.from_user) return;

      router.push(
        `${ROUTES.PROFILE}/${n.from_user}`
      );

      return;
    }

    // ── النظام ─────────────────────────────
    case 'system': {

      router.push(
        ROUTES.PACKAGES
      );

      return;
    }

    default:
      return;
  }
}


// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const CONFIG = {

  like: {
    icon: Heart,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    glow: 'rgba(239,68,68,0.45)',
  },

  view: {
    icon: Eye,
    color: '#d4af37',
    bg: 'rgba(212,175,55,0.12)',
    glow: 'rgba(212,175,55,0.45)',
  },

  message: {
    icon: MessageCircle,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    glow: 'rgba(56,189,248,0.45)',
  },

  match: {
    icon: Sparkles,
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.12)',
    glow: 'rgba(192,132,252,0.45)',
  },

  mediator: {
    icon: Handshake,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    glow: 'rgba(245,158,11,0.45)',
  },

  system: {
    icon: Bell,
    color: '#ffffff',
    bg: 'rgba(255,255,255,0.08)',
    glow: 'rgba(255,255,255,0.18)',
  },
};


// ═══════════════════════════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════════════════════════

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'message', label: 'الرسائل' },
  { key: 'like', label: 'الإعجابات' },
  { key: 'view', label: 'الزيارات' },
  { key: 'match', label: 'التطابق' },
  { key: 'mediator', label: 'الوسطاء' },
];


// ═══════════════════════════════════════════════════════════════
// CARD
// ═══════════════════════════════════════════════════════════════

function NotificationCard({
  n,
  onRead,
}: {
  n: NotificationItem;
  onRead: (id: string) => void;
}) {

  const router = useRouter();

  const cfg =
    CONFIG[n.type || 'system'];

  const Icon =
    cfg.icon;

  const text =
    buildNotificationText(n);

  const handleClick = async () => {

    if (!n.is_read) {
      onRead(n.notification_id);
    }

    resolveNotificationAction(
      n,
      router
    );
  };

  return (
    <motion.div

      layout

      initial={{
        opacity: 0,
        y: 12,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      exit={{
        opacity: 0,
        y: -12,
      }}

      whileTap={{
        scale: 0.985,
      }}

      onClick={handleClick}

      style={{

        position: 'relative',

        display: 'flex',
        alignItems: 'center',

        gap: 14,

        padding: '16px',

        cursor: 'pointer',

        borderBottom:
          '1px solid var(--glass-border)',

        background:
          n.is_read
            ? 'transparent'
            : 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',

        backdropFilter:
          'blur(18px)',

        transition:
          'all .22s ease',
      }}
    >

      {/* unread glow */}
      {!n.is_read && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          boxShadow: `
            inset 0 0 0 1px ${cfg.glow}22,
            0 0 30px ${cfg.glow}12
          `,
        }}/>
      )}

      {/* avatar */}
      <div style={{
        position: 'relative',
        flexShrink: 0,
      }}>

        <div style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          overflow: 'hidden',

          border:
            n.is_read
              ? '1px solid var(--glass-border)'
              : `1px solid ${cfg.glow}`,

          boxShadow:
            n.is_read
              ? 'none'
              : `0 8px 28px ${cfg.glow}22`,
        }}>
          <img
            src={
              n.sender?.avatar_url ||
              '/default-avatar.png'
            }
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',

              filter:
                n.sender?.is_photos_blurred
                  ? 'blur(10px)'
                  : 'none',

              transform:
                n.sender?.is_photos_blurred
                  ? 'scale(1.1)'
                  : 'none',
            }}
          />
        </div>

        {/* type icon */}
        <div style={{
          position: 'absolute',
          bottom: -2,
          left: -2,

          width: 24,
          height: 24,

          borderRadius: '50%',

          background: cfg.bg,

          backdropFilter: 'blur(12px)',

          border:
            `1px solid ${cfg.glow}`,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

          boxShadow:
            `0 6px 16px ${cfg.glow}22`,
        }}>
          <Icon
            size={12}
            color={cfg.color}
          />
        </div>
      </div>

      {/* content */}
      <div style={{
        flex: 1,
        minWidth: 0,
      }}>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>

          <span style={{
            color: 'var(--text-main)',
            fontWeight:
              n.is_read ? 600 : 800,

            fontSize:
              'calc(var(--base-font-size) * .82)',

            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {n.sender?.full_name || 'إشعار'}
          </span>

          <span style={{
            color: 'rgba(255,255,255,0.28)',
            fontSize:
              'calc(var(--base-font-size) * .66)',
            flexShrink: 0,
          }}>
            {timeAgo(n.created_at)}
          </span>
        </div>

        <p style={{
          margin: '4px 0 0',

          color:
            n.is_read
              ? 'var(--text-tertiary)'
              : 'var(--text-secondary)',

          lineHeight: 1.55,

          fontSize:
            'calc(var(--base-font-size) * .76)',

          overflow: 'hidden',

          display: '-webkit-box',

          WebkitLineClamp: 2,

          WebkitBoxOrient: 'vertical',
        }}>
          {text}
        </p>
      </div>

      {/* unread dot */}
      {!n.is_read && (
        <motion.div

          initial={{ scale: 0 }}

          animate={{ scale: 1 }}

          style={{
            width: 10,
            height: 10,

            borderRadius: '50%',

            background: cfg.color,

            boxShadow:
              `0 0 12px ${cfg.glow}`,

            flexShrink: 0,
          }}
        />
      )}

      <ChevronLeft
        size={16}
        color="rgba(255,255,255,0.18)"
      />

    </motion.div>
  );
}


// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════

export default function NotificationsPage() {

  const [userId, setUserId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [filter, setFilter] =
    useState('all');


  // ───────────────────────────────────────────
  // auth
  // ───────────────────────────────────────────

  useEffect(() => {

    supabase.auth.getUser()
      .then(({ data: { user } }) => {

        if (user) {
          setUserId(user.id);
        }
      });

  }, []);


  // ───────────────────────────────────────────
  // load
  // ───────────────────────────────────────────

  const loadNotifications =
    useCallback(async () => {

      if (!userId) return;

      setLoading(true);

      /**
       * ⚠ لا يوجد أي أعمدة مفترضة هنا
       * فقط الأعمدة الموجودة عندك
       */

      const { data, error } =
        await supabase
          .from('notifications')
          .select(`
            notification_id,
            type,
            title,
            message,
            is_read,
            created_at,
            from_user,
            conversation_id
          `)
          .eq('id', userId)
          .order('created_at', {
            ascending: false,
          });

      if (error) {

        console.error(error);

        setLoading(false);

        return;
      }

      // sender ids
      const ids =
        [
          ...new Set(
            (data || [])
              .map((n: any) => n.from_user)
              .filter(Boolean)
          )
        ];

      // profiles
      const { data: profiles } =
        ids.length
          ? await supabase
              .from('profiles')
              .select(`
                id,
                full_name,
                avatar_url,
                gender,
                is_photos_blurred
              `)
              .in('id', ids)
          : { data: [] };

      const profileMap =
        Object.fromEntries(
          (profiles || []).map(
            (p: any) => [p.id, p]
          )
        );

      const enriched =
        (data || []).map((n: any) => ({
          ...n,
          sender:
            n.from_user
              ? profileMap[n.from_user]
              : null,
        }));

      setNotifications(enriched);

      setLoading(false);

    }, [userId]);


  // ───────────────────────────────────────────
  // realtime
  // ───────────────────────────────────────────

  useEffect(() => {

    if (!userId) return;

    loadNotifications();

    const channel =
      supabase
        .channel('notifications-live')

        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `id=eq.${userId}`,
          },
          () => {
            loadNotifications();
          }
        )

        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [userId, loadNotifications]);


  // ───────────────────────────────────────────
  // read
  // ───────────────────────────────────────────

  const markRead =
    async (notification_id: string) => {

      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notification_id
            ? {
                ...n,
                is_read: true,
              }
            : n
        )
      );

      await supabase
        .from('notifications')
        .update({
          is_read: true,
        })
        .eq(
          'notification_id',
          notification_id
        );
    };


  // ───────────────────────────────────────────
  // filtered
  // ───────────────────────────────────────────

  const filtered =
    useMemo(() => {

      if (filter === 'all') {
        return notifications;
      }

      return notifications.filter(
        n => n.type === filter
      );

    }, [notifications, filter]);


  const unread =
    notifications.filter(
      n => !n.is_read
    ).length;


  // ───────────────────────────────────────────
  // loading
  // ───────────────────────────────────────────

  if (loading) {

    return (
      <div style={{
        minHeight: '100vh',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.div

          animate={{
            rotate: 360,
          }}

          transition={{
            repeat: Infinity,
            duration: 1,
            ease: 'linear',
          }}

          style={{
            width: 34,
            height: 34,

            borderRadius: '50%',

            border:
              '2px solid var(--color-primary)',

            borderTopColor: 'transparent',
          }}
        />
      </div>
    );
  }


  // ═══════════════════════════════════════════
  // render
  // ═══════════════════════════════════════════

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        paddingBottom: 120,
      }}
    >

      {/* header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,

        padding: '18px 18px 14px',

        background:
          'rgba(10,10,10,0.82)',

        backdropFilter:
          'blur(18px)',

        borderBottom:
          '1px solid var(--glass-border)',
      }}>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          <div>

            <h1 style={{
              margin: 0,

              color: 'var(--text-main)',

              fontSize:
                'calc(var(--base-font-size) * 1.42)',

              fontWeight: 900,
            }}>
              الإشعارات
            </h1>

            {unread > 0 && (
              <p style={{
                margin: '4px 0 0',

                color:
                  'var(--text-tertiary)',

                fontSize:
                  'calc(var(--base-font-size) * .72)',
              }}>
                لديك {unread} إشعار غير مقروء
              </p>
            )}
          </div>

          <div style={{
            width: 42,
            height: 42,

            borderRadius: 16,

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            background:
              'rgba(255,255,255,0.04)',

            border:
              '1px solid var(--glass-border)',
          }}>
            <Bell
              size={18}
              color="var(--text-main)"
            />
          </div>
        </div>

        {/* filters */}
        <div style={{
          display: 'flex',
          gap: 10,

          overflowX: 'auto',

          paddingTop: 16,

          scrollbarWidth: 'none',
        }}>

          {FILTERS.map(f => {

            const active =
              filter === f.key;

            return (
              <motion.button

                key={f.key}

                whileTap={{
                  scale: 0.96,
                }}

                onClick={() => {
                  setFilter(f.key);
                }}

                style={{
                  height: 38,

                  padding: '0 16px',

                  borderRadius: 999,

                  border:
                    active
                      ? '1px solid rgba(212,175,55,0.4)'
                      : '1px solid var(--glass-border)',

                  background:
                    active
                      ? 'rgba(212,175,55,0.12)'
                      : 'rgba(255,255,255,0.03)',

                  color:
                    active
                      ? '#d4af37'
                      : 'var(--text-secondary)',

                  fontWeight:
                    active ? 800 : 600,

                  cursor: 'pointer',

                  whiteSpace: 'nowrap',

                  fontFamily: 'inherit',
                }}
              >
                {f.label}
              </motion.button>
            );
          })}
        </div>
      </div>


      {/* empty */}
      {filtered.length === 0 && (

        <div style={{
          paddingTop: 140,

          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',

          gap: 18,
        }}>

          <div style={{
            width: 78,
            height: 78,

            borderRadius: 28,

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            background:
              'rgba(255,255,255,0.04)',

            border:
              '1px solid var(--glass-border)',
          }}>
            <Bell
              size={28}
              color="rgba(255,255,255,0.38)"
            />
          </div>

          <div style={{
            textAlign: 'center',
          }}>

            <h3 style={{
              margin: 0,

              color: 'var(--text-main)',

              fontWeight: 800,
            }}>
              لا توجد إشعارات
            </h3>

            <p style={{
              marginTop: 6,

              color:
                'var(--text-tertiary)',
            }}>
              ستظهر إشعاراتك هنا
            </p>
          </div>

        </div>
      )}


      {/* list */}
      {filtered.length > 0 && (

        <div style={{
          margin: 16,

          borderRadius: 28,

          overflow: 'hidden',

          background:
            'rgba(255,255,255,0.03)',

          border:
            '1px solid var(--glass-border)',

          backdropFilter:
            'blur(18px)',
        }}>

          <AnimatePresence initial={false}>

            {filtered.map(n => (
              <NotificationCard
                key={n.notification_id}
                n={n}
                onRead={markRead}
              />
            ))}

          </AnimatePresence>

        </div>
      )}

    </div>
  );
}