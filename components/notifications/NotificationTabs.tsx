'use client';
/**
 * 📁 components/notifications/NotificationTabs.tsx — ZAWAJ AI
 * ✅ عنوان ديناميكي + شريط مقسم + أيقونات + نقطة عدد
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, Heart, Eye, Sparkles, Handshake } from 'lucide-react';

export type NotificationFilter =
  | 'all' | 'message' | 'like' | 'view' | 'match' | 'mediator';

interface TabItem {
  key:   NotificationFilter;
  label: string;
  icon:  React.ReactNode;
}

interface Props {
  value:    NotificationFilter;
  onChange: (value: NotificationFilter) => void;
  counts?:  Partial<Record<NotificationFilter, number>>;
}

const TABS: TabItem[] = [
  { key: 'all',      label: 'الكل',      icon: <Bell          size={13} /> },
  { key: 'message',  label: 'الرسائل',   icon: <MessageCircle size={13} /> },
  { key: 'like',     label: 'الإعجابات', icon: <Heart         size={13} /> },
  { key: 'view',     label: 'الزيارات',  icon: <Eye           size={13} /> },
  { key: 'match',    label: 'التطابق',   icon: <Sparkles      size={13} /> },
  { key: 'mediator', label: 'الوسطاء',   icon: <Handshake     size={13} /> },
];

export default function NotificationTabs({ value, onChange, counts = {} }: Props) {
  const activeIdx  = TABS.findIndex(t => t.key === value);
  const activeTab  = TABS[activeIdx] ?? TABS[0];
  const totalCount = counts[value] ?? 0;

  return (
    <div dir="rtl" style={{
      position:     'sticky',
      top:          'var(--header-h-safe)',
      zIndex:       900,
      background:   'var(--bg-main)',
      borderBottom: '1px solid var(--glass-border)',
      padding:      'var(--sp-2) var(--sp-4) var(--sp-3)',
    }}>

      {/* ── العنوان الديناميكي ── */}
      <AnimatePresence mode="wait">
        <motion.div key={value}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.13 }}
          style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}
        >
          <span style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--text-main)' }}>
            {activeTab.label}
          </span>
          {totalCount > 0 && (
            <span style={{
              fontSize: 'var(--text-sm)', fontWeight: 700,
              color: 'var(--color-primary)',
              background: 'var(--color-primary-xsoft)',
              padding: '1px var(--sp-2)',
              borderRadius: 'var(--radius-full)',
            }}>
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── الشريط المقسم ── */}
      <div style={{ display: 'flex', gap: 5 }}>
        {TABS.map((tab, i) => {
          const isActive = i === activeIdx;
          const tabCount = counts[tab.key] ?? 0;
          return (
            <div key={tab.key} onClick={() => onChange(tab.key)}
              style={{ flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>

              {/* الشريط */}
              <motion.div
                animate={{ background: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)' }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', height: 4, borderRadius: 'var(--radius-full)' }}
              />

              {/* الأيقونة + نقطة العدد */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.span
                  animate={{ color: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.35)' }}
                  transition={{ duration: 0.18 }}
                  style={{ display: 'flex' }}
                >
                  {tab.icon}
                </motion.span>
                {tabCount > 0 && !isActive && (
                  <span style={{
                    position: 'absolute', top: -3, insetInlineEnd: -4,
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--color-primary)',
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
