'use client';
/**
 * 📁 app/notifications/page.tsx — ZAWAJ AI
 * ✅ NotificationTabs مع شريط مقسم
 * ✅ تجميع: آخر إشعار لكل (from_user + type) فقط
 * ✅ مسارات صحيحة: view?id= | chat?id=
 * ✅ زر الجرس يقرأ كل الإشعارات
 * ✅ Realtime
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Heart, Eye, MessageCircle,
  Sparkles, Handshake, Crown, ChevronLeft, CheckCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import NotificationTabs, { type NotificationFilter } from '@/components/notifications/NotificationTabs';

// ── أنواع ─────────────────────────────────────────────────────
type NotifType = 'like' | 'view' | 'message' | 'match' | 'mediator' | 'subscription' | 'system';

interface Sender {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  gender?: 'male' | 'female' | null;
  is_photos_blurred?: boolean | null;
  role?: string | null;
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
  // مفتاح التجميع: from_user + type
  _groupKey?: string;
}

// ── تكوين الأنواع ──────────────────────────────────────────────
const CONFIG: Record<string, { icon: any; color: string; bg: string; glow: string }> = {
  like:         { icon: Heart,         color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    glow: 'rgba(239,68,68,0.45)'    },
  view:         { icon: Eye,           color: '#d4af37', bg: 'rgba(212,175,55,0.12)',   glow: 'rgba(212,175,55,0.45)'   },
  message:      { icon: MessageCircle, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   glow: 'rgba(56,189,248,0.45)'   },
  match:        { icon: Sparkles,      color: '#c084fc', bg: 'rgba(192,132,252,0.12)',  glow: 'rgba(192,132,252,0.45)'  },
  mediator:     { icon: Handshake,     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   glow: 'rgba(245,158,11,0.45)'   },
  subscription: { icon: Crown,         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   glow: 'rgba(245,158,11,0.45)'   },
  system:       { icon: Bell,          color: '#ffffff', bg: 'rgba(255,255,255,0.08)',  glow: 'rgba(255,255,255,0.18)'  },
};

// ── وقت نسبي ──────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 15)  return 'الآن';
  if (s < 60)  return 'منذ لحظات';
  const m = Math.floor(s / 60);
  if (m === 1) return 'منذ دقيقة';
  if (m === 2) return 'منذ دقيقتين';
  if (m < 60)  return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h === 1) return 'منذ ساعة';
  if (h === 2) return 'منذ ساعتين';
  if (h < 24)  return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'أمس';
  if (d < 7)   return `منذ ${d} أيام`;
  return 'منذ مدة';
}

// ── نص الإشعار ────────────────────────────────────────────────
function buildText(n: NotificationItem): string {
  if (n.message) return n.message;
  const name   = n.sender?.full_name || 'مستخدم';
  const female = n.sender?.gender === 'female';
  switch (n.type) {
    case 'like':    return female ? `${name} معجبة بملفك` : `${name} معجب بملفك`;
    case 'view':    return female ? `${name} زارت ملفك`   : `${name} زار ملفك`;
    case 'message': return female ? `${name} أرسلت لك رسالة` : `${name} أرسل لك رسالة`;
    case 'match':   return `يوجد انسجام بينك وبين ${name}`;
    case 'mediator':return female ? `الوسيطة ${name} تريد التواصل` : `الوسيط ${name} يريد التواصل`;
    default:        return n.title || 'إشعار جديد';
  }
}

// ── التجميع: آخر إشعار لكل (from_user + type) ───────────────
function deduplicateNotifications(list: NotificationItem[]): NotificationItem[] {
  const seen = new Map<string, NotificationItem>();
  for (const n of list) {
    // الإشعارات بدون from_user (system) لا تُجمَّع
    const key = n.from_user ? `${n.from_user}::${n.type}` : n.notification_id;
    if (!seen.has(key)) {
      seen.set(key, { ...n, _groupKey: key });
    }
    // نبقي الأحدث فقط (القائمة مرتبة تنازلياً)
  }
  return Array.from(seen.values());
}

// ── المسار الصحيح ─────────────────────────────────────────────
function resolveRoute(n: NotificationItem): string | null {
  switch (n.type) {
    case 'message':
    case 'mediator':
      return n.conversation_id ? `/chat?id=${n.conversation_id}` : null;
    case 'like':
    case 'view':
    case 'match':
      return n.from_user ? `/view?id=${n.from_user}` : null;
    default:
      return null;
  }
}

// ── بطاقة الإشعار ─────────────────────────────────────────────
function NotificationCard({ n, onRead, onNavigate }: {
  n: NotificationItem;
  onRead: (id: string) => void;
  onNavigate: (route: string | null) => void;
}) {
  const cfg  = CONFIG[n.type ?? 'system'] ?? CONFIG.system;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!n.is_read) onRead(n.notification_id);
    onNavigate(resolveRoute(n));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileTap={{ scale: 0.987 }}
      onClick={handleClick}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '15px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--glass-border)',
        background: n.is_read ? 'transparent' : 'rgba(255,255,255,0.02)',
      }}
    >
      {/* حدود توهج للغير مقروء */}
      {!n.is_read && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          boxShadow: `inset 3px 0 0 ${cfg.color}`,
        }} />
      )}

      {/* الصورة + أيقونة النوع */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
          border: `1.5px solid ${n.is_read ? 'var(--glass-border)' : cfg.glow}`,
          boxShadow: n.is_read ? 'none' : `0 6px 20px ${cfg.glow}`,
        }}>
          <img
            src={n.sender?.avatar_url || '/default-avatar.png'}
            alt=""
            loading="lazy"
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter:    n.sender?.is_photos_blurred ? 'blur(10px)' : 'none',
              transform: n.sender?.is_photos_blurred ? 'scale(1.1)'  : 'none',
            }}
          />
        </div>
        <div style={{
          position: 'absolute', bottom: -2, left: -2,
          width: 22, height: 22, borderRadius: '50%',
          background: cfg.bg, border: `1.5px solid ${cfg.glow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${cfg.glow}`,
        }}>
          <Icon size={11} color={cfg.color} />
        </div>
        {n.sender?.role === 'mediator' && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            width: 20, height: 20, borderRadius: '50%',
            background: 'linear-gradient(135deg,#d4af37,#f8e7a1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-main)',
          }}>
            <Crown size={10} color="#000" />
          </div>
        )}
      </div>

      {/* النص */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <span style={{
            color: 'var(--text-main)', fontWeight: n.is_read ? 600 : 800,
            fontSize: 'calc(var(--base-font-size) * .84)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {n.sender?.full_name || 'إشعار'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 'calc(var(--base-font-size) * .66)', flexShrink: 0 }}>
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p style={{
          margin: 0,
          color: n.is_read ? 'var(--text-tertiary)' : 'var(--text-secondary)',
          fontSize: 'calc(var(--base-font-size) * .77)',
          lineHeight: 1.5,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {buildText(n)}
        </p>
      </div>

      {/* نقطة غير مقروء */}
      {!n.is_read && (
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: cfg.color, flexShrink: 0, boxShadow: `0 0 10px ${cfg.glow}` }} />
      )}
      <ChevronLeft size={15} color="rgba(255,255,255,0.18)" />
    </motion.div>
  );
}

// ── الصفحة ────────────────────────────────────────────────────
export default function NotificationsPage() {
  const router = useRouter();

  const [userId,        setUserId]        = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter,        setFilter]        = useState<NotificationFilter>('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // ── جلب الإشعارات ────────────────────────────────────────
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('notification_id,type,title,message,is_read,created_at,from_user,conversation_id')
      .eq('id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) { setLoading(false); return; }

    // جلب بيانات المرسلين
    const ids = [...new Set(data.map((n: any) => n.from_user).filter(Boolean))];
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('id,full_name,avatar_url,gender,is_photos_blurred,role').in('id', ids)
      : { data: [] };

    const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));

    const items: NotificationItem[] = data.map((n: any) => ({
      ...n,
      sender: n.from_user ? (profileMap[n.from_user] ?? null) : null,
    }));

    setNotifications(items);
    setLoading(false);
  }, [userId]);

  // ── Realtime ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    load();
    const ch = supabase
      .channel(`notif:${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `id=eq.${userId}`,
      }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, load]);

  // ── قراءة إشعار ─────────────────────────────────────────
  const markRead = async (notification_id: string) => {
    setNotifications(prev =>
      prev.map(n => n.notification_id === notification_id ? { ...n, is_read: true } : n)
    );
    await supabase.from('notifications').update({ is_read: true }).eq('notification_id', notification_id);
  };

  // ── قراءة الكل ───────────────────────────────────────────
  const markAllRead = async () => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true })
      .eq('id', userId).eq('is_read', false);
  };

  // ── التنقل ───────────────────────────────────────────────
  const navigate = (route: string | null) => {
    if (route) router.push(route);
  };

  // ── تجميع + فلترة ────────────────────────────────────────
  // أولاً: نجمع (آخر إشعار لكل from_user+type)
  // ثانياً: نفلتر حسب التبويب
  const deduplicated = useMemo(() => deduplicateNotifications(notifications), [notifications]);

  const filtered = useMemo(() =>
    filter === 'all' ? deduplicated : deduplicated.filter(n => n.type === filter),
    [deduplicated, filter]
  );

  // عدد الغير مقروء لكل تبويب (من القائمة الكاملة قبل التجميع)
  const counts = useMemo(() => {
    const c: Partial<Record<NotificationFilter, number>> = { all: 0 };
    for (const n of notifications) {
      if (!n.is_read) {
        c.all = (c.all ?? 0) + 1;
        const t = n.type as NotificationFilter;
        if (t) c[t] = (c[t] ?? 0) + 1;
      }
    }
    return c;
  }, [notifications]);

  const unreadTotal = counts.all ?? 0;

  // ── تحميل ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingBottom: 'var(--nav-h)' }}>

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: 'var(--sp-4) var(--sp-4) var(--sp-3)',
        background: 'var(--bg-main)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          
          {unreadTotal > 0 && (
            <p style={{ margin: '3px 0 0', color: 'var(--text-tertiary)', fontSize: 'calc(var(--base-font-size) * .72)' }}>
              {unreadTotal} إشعار غير مقروء
            </p>
          )}
        </div>

        {/* زر قراءة الكل */}
        {unreadTotal > 0 && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={markAllRead}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: 'var(--sp-2) var(--sp-3)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <CheckCheck size={14} />
            قراءة الكل
          </motion.button>
        )}
      </div>

      {/* ── التبويبات ── */}
      <NotificationTabs
        value={filter}
        onChange={setFilter}
        counts={counts}
      />

      {/* ── القائمة ── */}
      {filtered.length === 0 ? (
        <div style={{ padding: 'var(--sp-16)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          }}>
            <Bell size={26} color="rgba(255,255,255,0.25)" />
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontWeight: 700, margin: 0, fontSize: 'var(--text-sm)' }}>
            لا توجد إشعارات
          </p>
        </div>
      ) : (
        <div style={{
          margin: 'var(--sp-4)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
        }}>
          <AnimatePresence initial={false}>
            {filtered.map(n => (
              <NotificationCard
                key={n._groupKey ?? n.notification_id}
                n={n}
                onRead={markRead}
                onNavigate={navigate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
