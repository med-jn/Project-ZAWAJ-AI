'use client';
import { Lbl } from './Lbl';

interface IdPillsProps<T extends { id: number }> {
  label: string;
  items: T[];
  getLabel: (item: T) => string;
  value: number | null;
  onChange: (id: number) => void;
  error?: string;
}

export default function IdPills<T extends { id: number }>({
  label, items, getLabel, value, onChange, error,
}: IdPillsProps<T>) {
  return (
    <div style={{ marginBottom: 24 }}>
      {label && <Lbl t={label} err={!!error} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map(item => {
          const active = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              style={{
                padding: '9px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: active ? 'var(--color-primary)' : 'rgba(0,0,0,0)',
                outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 400,
                fontFamily: 'inherit',
                boxShadow: active ? '0 4px 18px var(--shadow-red-glow)' : 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                transform: 'scale(1)',
              }}
              onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
              onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >{getLabel(item)}</button>
          );
        })}
      </div>
      {error && (
        <p style={{ color: 'var(--error-text)', fontSize: 'var(--text-xs)', marginTop: 'var(--sp-1)' }}>{error}</p>
      )}
    </div>
  );
}