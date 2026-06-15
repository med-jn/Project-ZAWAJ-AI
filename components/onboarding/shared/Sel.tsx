'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { Lbl } from './Lbl';

interface SelProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  error?: string;
  ph?: string;
}

export default function Sel({ label, value, options, onChange, error, ph = 'اختر...' }: SelProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const safe = Array.isArray(options) ? options : [];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ marginBottom: 24, position: 'relative' }}>
      <Lbl t={label} err={!!error} />
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: `1.5px solid ${error ? 'var(--color-accent)' : open ? 'var(--color-primary)' : 'var(--input-line)'}`,
          padding: 'var(--sp-3) 0',
          fontSize: 'var(--text-base)',
          fontWeight: 500,
          color: 'var(--text-main)',
          outline: 'none',
          fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <span style={{
          color: value ? 'var(--text-main)' : 'var(--input-placeholder)',
          fontWeight: value ? 500 : 400,
          fontSize: 'var(--text-base)',
        }}>{value || ph}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: 'var(--color-primary)', opacity: 0.7, flexShrink: 0 }} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.92 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.92 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute', zIndex: 1000, width: '100%',
              top: 'calc(100% + 6px)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 18, overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 4px 16px var(--shadow-red-glow)',
              maxHeight: 240, overflowY: 'auto',
              transformOrigin: 'top',
            }}
          >
            {safe.map((o, i) => (
              <button
                key={`${o}-${i}`}
                type="button"
                onClick={() => { onChange(o); setOpen(false); }}
                style={{
                  width: '100%', textAlign: 'right', direction: 'rtl',
                  padding: '13px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: value === o ? 'var(--color-primary-soft)' : 'transparent',
                  borderBottom: i < safe.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  color: value === o ? 'var(--color-primary)' : 'var(--text-main)',
                  fontSize: 'var(--text-sm)', fontWeight: value === o ? 600 : 400,
                  fontFamily: 'inherit', cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.12s',
                }}
              >
                <span>{o}</span>
                {value === o && <Check size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {error && (
        <p style={{ color: 'var(--error-text)', fontSize: 'var(--text-xs)', marginTop: 'var(--sp-1)' }}>{error}</p>
      )}
    </div>
  );
}