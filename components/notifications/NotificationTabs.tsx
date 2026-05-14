'use client';

/**
 * 📁 components/notifications/NotificationTabs.tsx
 * ZAWAJ AI
 * Luxury Notifications Filter Tabs
 */

import { motion } from 'framer-motion';

import {
  Bell,
  MessageCircle,
  Heart,
  Eye,
  Sparkles,
  Handshake,
} from 'lucide-react';

export type NotificationFilter =
  | 'all'
  | 'message'
  | 'like'
  | 'view'
  | 'match'
  | 'mediator';

interface TabItem {
  key: NotificationFilter;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  value: NotificationFilter;

  onChange: (
    value: NotificationFilter
  ) => void;

  counts?: Partial<
    Record<NotificationFilter, number>
  >;
}

const TABS: TabItem[] = [
  {
    key: 'all',
    label: 'الكل',
    icon: <Bell size={14} />,
  },

  {
    key: 'message',
    label: 'الرسائل',
    icon: <MessageCircle size={14} />,
  },

  {
    key: 'like',
    label: 'الإعجابات',
    icon: <Heart size={14} />,
  },

  {
    key: 'view',
    label: 'الزيارات',
    icon: <Eye size={14} />,
  },

  {
    key: 'match',
    label: 'التطابق',
    icon: <Sparkles size={14} />,
  },

  {
    key: 'mediator',
    label: 'الوسطاء',
    icon: <Handshake size={14} />,
  },
];

export default function NotificationTabs({
  value,
  onChange,
  counts = {},
}: Props) {
  return (
    <div
      dir="rtl"
      style={{
        position: 'sticky',
        top: 73,
        zIndex: 8,

        padding: '12px 16px 14px',

        backdropFilter: 'blur(18px)',

        background:
          'linear-gradient(to bottom, rgba(10,10,10,0.96), rgba(10,10,10,0.82))',

        borderBottom:
          '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {TABS.map(tab => {
          const active =
            value === tab.key;

          const count =
            counts[tab.key] ?? 0;

          return (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                onChange(tab.key)
              }
              style={{
                position: 'relative',

                height: 42,

                padding:
                  '0 16px',

                borderRadius: 999,

                display: 'flex',
                alignItems: 'center',
                gap: 8,

                flexShrink: 0,

                cursor: 'pointer',

                border: active
                  ? '1px solid rgba(212,175,55,0.28)'
                  : '1px solid rgba(255,255,255,0.05)',

                background: active
                  ? 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.08))'
                  : 'rgba(255,255,255,0.03)',

                color: active
                  ? '#f3d27a'
                  : 'rgba(255,255,255,0.72)',

                boxShadow: active
                  ? '0 4px 18px rgba(212,175,55,0.12)'
                  : 'none',

                transition:
                  'all .18s ease',

                fontFamily:
                  'inherit',
              }}
            >
              {/* Glow */}
              {active && (
                <motion.div
                  layoutId="notif-tab-glow"
                  transition={{
                    type: 'spring',
                    bounce: 0.22,
                    duration: 0.45,
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 999,

                    background:
                      'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.02))',

                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Icon */}
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tab.icon}
              </span>

              {/* Label */}
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,

                  fontSize:
                    'calc(var(--base-font-size) * 0.76)',

                  fontWeight: active
                    ? 800
                    : 600,

                  whiteSpace:
                    'nowrap',
                }}
              >
                {tab.label}
              </span>

              {/* Counter */}
              {count > 0 && (
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,

                    minWidth: 18,
                    height: 18,

                    padding:
                      '0 5px',

                    borderRadius: 999,

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                    background: active
                      ? '#d4af37'
                      : 'rgba(255,255,255,0.08)',

                    color: active
                      ? '#000'
                      : '#fff',

                    fontSize:
                      '10px',

                    fontWeight: 800,
                  }}
                >
                  {count > 99
                    ? '99+'
                    : count}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}