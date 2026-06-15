'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lbl } from './Lbl';

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  maxLength?: number;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email';
  rows?: number;
  multiline?: boolean;
}

export default function Field({
  label, value, onChange, placeholder = '', type = 'text',
  error = '', maxLength, inputMode, multiline = false,
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  const baseStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: `1.5px solid ${error ? 'var(--color-accent)' : focused ? 'var(--color-primary)' : 'var(--input-line)'}`,
    padding: 'var(--sp-3) 0',
    fontSize: 'var(--text-base)',
    fontWeight: 500,
    color: 'var(--text-main)',
    caretColor: 'var(--color-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    WebkitTapHighlightColor: 'transparent',
    transition: 'border-color 0.2s',
    resize: multiline ? 'none' : undefined,
    lineHeight: multiline ? 1.75 : undefined,
    display: multiline ? 'block' : undefined,
  };

  return (
    <div style={{ marginBottom: 24, position: 'relative' }}>
      <Lbl t={label} err={!!error} />
      <div style={{ position: 'relative' }}>
        {multiline ? (
          <textarea
            value={value}
            dir="auto"
            placeholder={placeholder}
            maxLength={maxLength}
            rows={3}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={baseStyle}
          />
        ) : (
          <input
            type={type}
            value={value}
            dir="auto"
            placeholder={placeholder}
            maxLength={maxLength}
            inputMode={inputMode}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={baseStyle}
          />
        )}
        <motion.div
          animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
            background: 'var(--color-primary)', borderRadius: 2,
            transformOrigin: 'left', pointerEvents: 'none',
          }}
        />
      </div>
      {maxLength && multiline && (
        <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textAlign: 'left', marginTop: 'var(--sp-1)' }}>
          {value.length}/{maxLength}
        </p>
      )}
      {error && (
        <p style={{ color: 'var(--error-text)', fontSize: 'var(--text-xs)', marginTop: 'var(--sp-1)' }}>{error}</p>
      )}
    </div>
  );
}