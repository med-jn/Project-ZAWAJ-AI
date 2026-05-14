'use client';

import { motion } from 'framer-motion';
import {
  Heart,
  Eye,
  MessageCircle,
  Bell,
  Sparkles,
  Handshake,
  Crown,
  ShieldCheck,
  CreditCard,
  UserPlus,
  CheckCheck,
  Gem,
} from 'lucide-react';

// ═════════════════════════════════════════════════════════════
// الأنواع
// ═════════════════════════════════════════════════════════════

export type NotificationType =
  | 'like'
  | 'view'
  | 'message'
  | 'match'
  | 'mediator'
  | 'subscription'
  | 'contact_request'
  | 'contact_accepted'
  | 'verification'
  | 'system';

export interface NotificationSender {
  id: string;
  full_name: string;
  gender?: 'male' | 'female';
  avatar_url?: string | null;
  is_photos_blurred?: boolean | null;
  role?: string | null;
}

export interface NotificationItem {
  notification_id: string;

  // مهم: لا تفترض أي أعمدة غير موجودة
  // هذه الحقول يجب أن تأتي كما هي من جدول notifications
  type: NotificationType;
  title: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;

  from_user: string | null;

  // بيانات إضافية تأتي من السيرفر أو page.tsx
  route?: string | null;
  conversation_id?: string | null;

  sender?: NotificationSender | null;
}

interface Props {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
  onRead: (id: string) => void;
}

// ═════════════════════════════════════════════════════════════
// الوقت النسبي
// ═════════════════════════════════════════════════════════════

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();

  const sec = Math.floor(diff / 1000);
  if (sec < 8) return 'الآن';

  const min = Math.floor(sec / 60);

  if (min === 1) return 'منذ دقيقة';
  if (min === 2) return 'منذ دقيقتين';
  if (min < 60) return `منذ ${min} دقيقة`;

  const hr = Math.floor(min / 60);

  if (hr === 1) return 'منذ ساعة';
  if (hr === 2) return 'منذ ساعتين';
  if (hr < 24) return `منذ ${hr} ساعات`;

  const day = Math.floor(hr / 24);

  if (day === 1) return 'منذ يوم';
  if (day === 2) return 'منذ يومين';
  if (day < 30) return `منذ ${day} أيام`;

  const month = Math.floor(day / 30);

  if (month === 1) return 'منذ شهر';
  if (month < 12) return `منذ ${month} أشهر`;

  return 'منذ مدة';
}

// ═════════════════════════════════════════════════════════════
// الضمائر الذكية حسب الجنس
// ═════════════════════════════════════════════════════════════

function getVerbByGender(
  gender: 'male' | 'female' | undefined,
  male: string,
  female: string
) {
  return gender === 'female' ? female : male;
}

// ═════════════════════════════════════════════════════════════
// تكوين كل نوع إشعار
// ═════════════════════════════════════════════════════════════

const CONFIG: Record<NotificationType, {
  icon: React.ReactNode;
  iconBg: string;
  glow: string;
  border: string;
}> = {
  like: {
    icon: <Heart size={11} fill="white" strokeWidth={0} />,
    iconBg: 'linear-gradient(135deg,#b91c1c,#ef4444)',
    glow: 'rgba(239,68,68,0.35)',
    border: 'rgba(239,68,68,0.4)',
  },

  view: {
    icon: <Eye size={11} />,
    iconBg: 'linear-gradient(135deg,#d4af37,#f7d774)',
    glow: 'rgba(212,175,55,0.3)',
    border: 'rgba(212,175,55,0.4)',
  },

  message: {
    icon: <MessageCircle size={11} />,
    iconBg: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
    glow: 'rgba(56,189,248,0.3)',
    border: 'rgba(56,189,248,0.35)',
  },

  match: {
    icon: <Sparkles size={11} />,
    iconBg: 'linear-gradient(135deg,#a855f7,#ec4899)',
    glow: 'rgba(236,72,153,0.3)',
    border: 'rgba(236,72,153,0.35)',
  },

  mediator: {
    icon: <Handshake size={11} />,
    iconBg: 'linear-gradient(135deg,#d4af37,#f9e29d)',
    glow: 'rgba(212,175,55,0.35)',
    border: 'rgba(212,175,55,0.45)',
  },

  subscription: {
    icon: <Gem size={11} />,
    iconBg: 'linear-gradient(135deg,#7c3aed,#c084fc)',
    glow: 'rgba(192,132,252,0.3)',
    border: 'rgba(192,132,252,0.35)',
  },

  contact_request: {
    icon: <UserPlus size={11} />,
    iconBg: 'linear-gradient(135deg,#0891b2,#22d3ee)',
    glow: 'rgba(34,211,238,0.28)',
    border: 'rgba(34,211,238,0.35)',
  },

  contact_accepted: {
    icon: <CheckCheck size={11} />,
    iconBg: 'linear-gradient(135deg,#16a34a,#4ade80)',
    glow: 'rgba(74,222,128,0.25)',
    border: 'rgba(74,222,128,0.35)',
  },

  verification: {
    icon: <ShieldCheck size={11} />,
    iconBg: 'linear-gradient(135deg,#2563eb,#60a5fa)',
    glow: 'rgba(96,165,250,0.3)',
    border: 'rgba(96,165,250,0.35)',
  },

  system: {
    icon: <Bell size={11} />,
    iconBg: 'linear-gradient(135deg,#27272a,#52525b)',
    glow: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.08)',
  },
};

// ═════════════════════════════════════════════════════════════
// النصوص الذكية
// ═════════════════════════════════════════════════════════════

function buildNotificationText(item: NotificationItem): string {
  if (item.message?.trim()) {
    return item.message;
  }

  const senderName = item.sender?.full_name || 'مستخدم';
  const gender = item.sender?.gender;

  switch (item.type) {
    case 'like':
      return `${senderName} ${getVerbByGender(gender, 'أعجب', 'أعجبت')} بملفك الشخصي`;

    case 'view':
      return `${senderName} ${getVerbByGender(gender, 'زار', 'زارت')} ملفك الشخصي`;

    case 'message':
      return `${senderName} ${getVerbByGender(gender, 'أرسل', 'أرسلت')} لك رسالة جديدة`;

    case 'match':
      return `حدث تطابق جديد بينك وبين ${senderName}`;

    case 'mediator':
      return `الوسيط ${senderName} ${getVerbByGender(gender, 'أرسل', 'أرسلت')} طلب تواصل`;

    case 'subscription':
      return 'تم تحديث اشتراكك بنجاح';

    case 'contact_request':
      return `${senderName} ${getVerbByGender(gender, 'يريد', 'تريد')} التواصل معك`;

    case 'contact_accepted':
      return `${senderName} ${getVerbByGender(gender, 'وافق', 'وافقت')} على طلب التواصل`;

    case 'verification':
      return 'تم توثيق حسابك بنجاح';

    default:
      return item.title || 'إشعار جديد';
  }
}

// ═════════════════════════════════════════════════════════════
// البطاقة
// ═════════════════════════════════════════════════════════════

export default function NotificationCard({
  item,
  onPress,
  onRead,
}: Props) {
  const cfg = CONFIG[item.type] || CONFIG.system;

  const senderName = item.sender?.full_name || 'إشعار';

  const text = buildNotificationText(item);

  const blurred = item.sender?.is_photos_blurred;

  const handleClick = () => {
    if (!item.is_read) {
      onRead(item.notification_id);
    }

    onPress(item);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.988 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      dir="rtl"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '15px 16px',
        background: item.is_read
          ? 'transparent'
          : 'linear-gradient(135deg,rgba(255,255,255,0.03),rgba(212,175,55,0.035))',
        border: 'none',
        borderBottom: '1px solid var(--glass-border)',
        cursor: 'pointer',
        textAlign: 'right',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* الأفاتار */}
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `1px solid ${cfg.border}`,
            background: 'rgba(255,255,255,0.04)',
            boxShadow: item.is_read
              ? 'none'
              : `0 0 18px ${cfg.glow}`,
          }}
        >
          <img
            src={item.sender?.avatar_url || '/default-avatar.png'}
            alt=""
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: blurred ? 'blur(10px)' : 'none',
              transform: blurred ? 'scale(1.1)' : 'none',
            }}
          />
        </div>

        {/* أيقونة النوع */}
        <div
          style={{
            position: 'absolute',
            bottom: -3,
            left: -3,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: cfg.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg-main)',
            color: '#fff',
            boxShadow: `0 6px 18px ${cfg.glow}`,
          }}
        >
          {cfg.icon}
        </div>

        {/* تاج الوسيط */}
        {item.sender?.role === 'mediator' && (
          <div
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#d4af37,#f8e7a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-main)',
              boxShadow: '0 4px 12px rgba(212,175,55,0.35)',
            }}
          >
            <Crown size={11} color="#000" />
          </div>
        )}
      </div>

      {/* النص */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {/* الاسم + الوقت */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <span
            style={{
              color: 'var(--text-main)',
              fontWeight: item.is_read ? 700 : 900,
              fontSize: '0.92rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {senderName}
          </span>

          <span
            style={{
              color: 'rgba(255,255,255,0.32)',
              fontSize: '0.7rem',
              flexShrink: 0,
            }}
          >
            {timeAgo(item.created_at)}
          </span>
        </div>

        {/* النص */}
        <p
          style={{
            margin: 0,
            color: item.is_read
              ? 'var(--text-tertiary)'
              : 'var(--text-secondary)',
            lineHeight: 1.55,
            fontSize: '0.8rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {text}
        </p>
      </div>

      {/* مؤشر غير مقروء */}
      {!item.is_read && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(164,22,26,0.6)',
          }}
        />
      )}
    </motion.button>
  );
}