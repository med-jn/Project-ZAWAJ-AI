'use client';
/**
 * 📁 components/notifications/NotificationsList.tsx — ZAWAJ AI
 * ✅ props صحيحة متوافقة مع NotificationCard
 * ✅ تجميع زمني فاخر
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import NotificationCard from './NotificationCard';
import type { NotificationFilter } from './NotificationTabs';
import type { NotificationItem } from './NotificationCard';

interface Props {
  notifications: NotificationItem[];
  filter:        NotificationFilter;
  onOpen:        (item: NotificationItem) => void;
  onRead:        (id: string) => void;
}

function getGroupLabel(date: string): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0)  return 'اليوم';
  if (days === 1) return 'أمس';
  if (days <= 7)  return 'هذا الأسبوع';
  if (days <= 30) return 'هذا الشهر';
  return 'الأقدم';
}

export default function NotificationsList({ notifications, filter, onOpen, onRead }: Props) {
  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  if (!filtered.length) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ padding: 'var(--sp-16)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-4)', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        }}>
          <Bell size={26} color="rgba(255,255,255,0.2)" />
        </div>
        <p style={{ margin: 0, color: 'var(--text-tertiary)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
          لا توجد إشعارات
        </p>
      </motion.div>
    );
  }

  // تجميع زمني
  const groups: Record<string, NotificationItem[]> = {};
  for (const n of filtered) {
    const label = getGroupLabel(n.created_at);
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return (
    <div style={{ padding: 'var(--sp-3) var(--sp-4) var(--sp-16)' }}>
      <AnimatePresence initial={false}>
        {Object.entries(groups).map(([group, items], gi) => (
          <motion.section key={group}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.04 }}
            style={{ marginBottom: 'var(--sp-6)' }}>

            {/* عنوان المجموعة */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)', padding: '0 var(--sp-1)' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--color-primary)',
                boxShadow: '0 0 8px rgba(164,22,26,0.5)',
              }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: 'calc(var(--base-font-size) * 0.76)' }}>
                {group}
              </span>
            </div>

            {/* البطاقات */}
            <div style={{
              borderRadius: 'var(--radius-xl)', overflow: 'hidden',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
            }}>
              <AnimatePresence initial={false}>
                {items.map((n, i) => (
                  <motion.div key={n.notification_id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }} transition={{ delay: i * 0.025 }}>
                    <NotificationCard
                      item={n}
                      onPress={onOpen}
                      onRead={onRead}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        ))}
      </AnimatePresence>
    </div>
  );
}
