'use client';
import { Lbl } from './Lbl';

interface PillsProps {
  label: string;
  options: string[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  error?: string;
  multi?: boolean;
  max?: number;
}

export default function Pills({ label, options, value, onChange, error, multi = false, max }: PillsProps) {
  const safe = Array.isArray(options) ? options : [];
  const sel = (o: string) => multi ? (value as string[]).includes(o) : value === o;
  const tap = (o: string) => {
    if (!multi) { onChange(o); return; }
    const a = value as string[];
    if (a.includes(o)) onChange(a.filter(x => x !== o));
    else if (!max || a.length < max) onChange([...a, o]);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {label && <Lbl t={label} err={!!error} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {safe.map(o => {
          const active = sel(o);
          const disabled = multi && !active && (value as string[]).length >= (max ?? 999);
          return (
            <button
              key={o}
              type="button"
              disabled={disabled}
              onClick={() => tap(o)}
              style={{
                padding: '9px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: active ? 'var(--color-primary)' : 'rgba(0,0,0,0)',
                outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                outlineOffset: 0,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 400,
                fontFamily: 'inherit', opacity: disabled ? 0.28 : 1,
                boxShadow: active ? '0 4px 18px var(--shadow-red-glow)' : 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                transform: 'scale(1)',
              }}
              onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
              onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >{o}</button>
          );
        })}
      </div>
      {error && (
        <p style={{ color: 'var(--error-text)', fontSize: 'var(--text-xs)', marginTop: 'var(--sp-1)' }}>{error}</p>
      )}
    </div>
  );
}