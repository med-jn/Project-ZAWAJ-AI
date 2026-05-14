'use client';

/**
 * 📁 components/notifications/NotificationsList.tsx
 * ZAWAJ AI
 * Enterprise Notifications Feed
 */

import { motion, AnimatePresence } from 'framer-motion';

import NotificationCard from './NotificationCard';

import type {
  NotificationFilter,
} from './NotificationTabs';

interface Sender {
  id: string;

  full_name: string;

  avatar_url: string | null;

  gender?: 'male' | 'female' | null;

  is_photos_blurred?: boolean | null;
}

export interface NotificationItem {
  notification_id: string;

  type: string;

  title?: string | null;

  message?: string | null;

  is_read: boolean;

  created_at: string;

  from_user?: string | null;

  conversation_id?: string | null;

  sender?: Sender | null;
}

interface Props {
  notifications: NotificationItem[];

  filter: NotificationFilter;

  onOpen: (
    notification: NotificationItem
  ) => void;

  onRead: (
    notificationId: string
  ) => void;
}

/**
 * ─────────────────────────────────────────────
 * تقسيم زمني فاخر
 * ─────────────────────────────────────────────
 */

function getGroupLabel(date: string) {
  const now = new Date();

  const d = new Date(date);

  const diff =
    now.getTime() - d.getTime();

  const days =
    Math.floor(
      diff / (1000 * 60 * 60 * 24)
    );

  if (days <= 0) {
    return 'اليوم';
  }

  if (days === 1) {
    return 'أمس';
  }

  if (days <= 7) {
    return 'هذا الأسبوع';
  }

  if (days <= 30) {
    return 'هذا الشهر';
  }

  return 'الأقدم';
}

/**
 * ─────────────────────────────────────────────
 * فلترة
 * ─────────────────────────────────────────────
 */

function filterNotifications(
  notifications: NotificationItem[],
  filter: NotificationFilter
) {
  if (filter === 'all') {
    return notifications;
  }

  return notifications.filter(
    n => n.type === filter
  );
}

/**
 * ─────────────────────────────────────────────
 * تجميع
 * ─────────────────────────────────────────────
 */

function groupNotifications(
  notifications: NotificationItem[]
) {
  const groups:
    Record<
      string,
      NotificationItem[]
    > = {};

  for (const notif of notifications) {
    const label =
      getGroupLabel(
        notif.created_at
      );

    if (!groups[label]) {
      groups[label] = [];
    }

    groups[label].push(notif);
  }

  return groups;
}

export default function NotificationsList({
  notifications,
  filter,
  onOpen,
  onRead,
}: Props) {

  const filtered =
    filterNotifications(
      notifications,
      filter
    );

  const grouped =
    groupNotifications(filtered);

  // ─────────────────────────
  // Empty State
  // ─────────────────────────

  if (!filtered.length) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        style={{
          padding:
            '90px 24px',

          display: 'flex',

          flexDirection:
            'column',

          alignItems:
            'center',

          justifyContent:
            'center',

          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 74,
            height: 74,

            borderRadius: 26,

            display: 'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            marginBottom: 18,

            border:
              '1px solid rgba(255,255,255,0.06)',

            background:
              'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',

            backdropFilter:
              'blur(18px)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,

              borderRadius:
                '50%',

              background:
                'rgba(212,175,55,0.12)',

              boxShadow:
                '0 0 24px rgba(212,175,55,0.18)',
            }}
          />
        </div>

        <h3
          style={{
            margin: 0,

            color:
              'var(--text-main)',

            fontWeight: 800,

            fontSize:
              'calc(var(--base-font-size) * 1.02)',
          }}
        >
          لا توجد إشعارات
        </h3>

        <p
          style={{
            marginTop: 10,

            maxWidth: 320,

            lineHeight: 1.7,

            color:
              'var(--text-tertiary)',

            fontSize:
              'calc(var(--base-font-size) * 0.78)',
          }}
        >
          عندما يصلك أي نشاط جديد
          سيظهر هنا بشكل مرتب
          واحترافي.
        </p>
      </motion.div>
    );
  }

  return (
    <div
      style={{
        padding:
          '14px 16px 120px',
      }}
    >
      <AnimatePresence initial={false}>
        {Object.entries(grouped).map(
          ([group, items]) => (
            <motion.section
              key={group}

              initial={{
                opacity: 0,
                y: 10,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              exit={{
                opacity: 0,
              }}

              style={{
                marginBottom: 26,
              }}
            >
              {/* ───────────────── */}
              {/* عنوان المجموعة */}
              {/* ───────────────── */}

              <div
                style={{
                  display: 'flex',

                  alignItems:
                    'center',

                  gap: 10,

                  marginBottom: 12,

                  padding:
                    '0 4px',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,

                    borderRadius:
                      '50%',

                    background:
                      'rgba(212,175,55,0.9)',

                    boxShadow:
                      '0 0 12px rgba(212,175,55,0.45)',
                  }}
                />

                <span
                  style={{
                    color:
                      'var(--text-secondary)',

                    fontWeight: 800,

                    letterSpacing:
                      '-0.01em',

                    fontSize:
                      'calc(var(--base-font-size) * 0.78)',
                  }}
                >
                  {group}
                </span>
              </div>

              {/* ───────────────── */}
              {/* البطاقات */}
              {/* ───────────────── */}

              <div
                style={{
                  overflow:
                    'hidden',

                  borderRadius: 28,

                  border:
                    '1px solid rgba(255,255,255,0.06)',

                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02))',

                  backdropFilter:
                    'blur(18px)',
                }}
              >
                <AnimatePresence initial={false}>
                  {items.map(
                    (
                      notification,
                      index
                    ) => (
                      <motion.div
                        key={
                          notification.notification_id
                        }

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
                          x: 20,
                        }}

                        transition={{
                          duration: 0.22,
                          delay:
                            index *
                            0.025,
                        }}
                      >
                        <NotificationCard
                          notification={
                            notification
                          }

                          onOpen={() =>
                            onOpen(
                              notification
                            )
                          }

                          onRead={() =>
                            onRead(
                              notification.notification_id
                            )
                          }
                        />
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          )
        )}
      </AnimatePresence>
    </div>
  );
}