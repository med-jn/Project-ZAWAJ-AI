'use client';
import { motion } from 'framer-motion';

const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: '7px 16px',
  borderRadius: 'var(--radius-full)',
  border: 'none', cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'var(--text-sm)',
  fontWeight: active ? 700 : 400,
  background: active ? 'var(--color-primary)' : 'var(--glass-bg)',
  color: active ? '#fff' : 'var(--text-secondary)',
  outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
  boxShadow: active ? '0 3px 12px var(--shadow-red-glow)' : 'none',
  transition: 'all 0.15s ease',
  WebkitTapHighlightColor: 'transparent',
});

export function MultiPills({
  options, selected, onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const active = selected.includes(o);
        return (
          <motion.button
            key={o} type="button" whileTap={{ scale: 0.92 }}
            onClick={() => onChange(
              active ? selected.filter(x => x !== o) : [...selected, o]
            )}
            style={pillStyle(active)}
          >{o}</motion.button>
        );
      })}
    </div>
  );
}

export function IdMultiPills<T extends { id: number }>({
  items, getLabel, selected, onChange,
}: {
  items: T[];
  getLabel: (i: T) => string;
  selected: number[];
  onChange: (v: number[]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map(item => {
        const active = selected.includes(item.id);
        return (
          <motion.button
            key={item.id} type="button" whileTap={{ scale: 0.92 }}
            onClick={() => onChange(
              active
                ? selected.filter(x => x !== item.id)
                : [...selected, item.id]
            )}
            style={pillStyle(active)}
          >{getLabel(item)}</motion.button>
        );
      })}
    </div>
  );
}