'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Props {
  icon: React.ReactNode;
  title: string;
  activeCount?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function FilterAccordion({
  icon, title, activeCount = 0, children, defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const isActive = activeCount > 0;

  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      border: `1px solid ${isActive ? 'var(--color-primary-soft)' : 'var(--glass-border)'}`,
      overflow: 'hidden',
      marginBottom: 'var(--sp-3)',
      boxShadow: isActive ? '0 4px 16px var(--shadow-red-glow)' : 'none',
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}>
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          padding: 'var(--sp-4)',
          display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
          background: open && isActive ? 'var(--color-primary-xsoft)' : 'transparent',
          border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--glass-border)' : 'none',
          direction: 'rtl',
          WebkitTapHighlightColor: 'transparent',
          transition: 'background 0.2s',
        }}
      >
        {/* أيقونة القسم */}
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: isActive ? 'var(--color-primary-xsoft)' : 'var(--bg-soft)',
          border: `1px solid ${isActive ? 'var(--color-primary-soft)' : 'var(--glass-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)',
          transition: 'all 0.2s',
        }}>
          {icon}
        </div>

        {/* العنوان */}
        <span style={{
          flex: 1, textAlign: 'right',
          fontWeight: 800, fontSize: 'var(--text-sm)',
          color: isActive ? 'var(--color-primary)' : 'var(--text-main)',
          transition: 'color 0.2s',
        }}>{title}</span>

        {/* عداد الفلاتر النشطة */}
        {isActive && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              minWidth: 20, height: 20,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary)', color: '#fff',
              fontSize: 10, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 6px', flexShrink: 0,
              boxShadow: '0 2px 8px var(--shadow-red-glow)',
            }}
          >{activeCount}</motion.span>
        )}

        {/* سهم */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          style={{ flexShrink: 0 }}
        >
          <ChevronDown size={16} color="var(--text-tertiary)" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: 'var(--sp-4)',
              display: 'flex', flexDirection: 'column',
              gap: 'var(--sp-4)',
            }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}