'use client';
import React from 'react';

interface RowProps {
  icon:        React.ReactNode;
  label:       string;
  value:       string;
  valueColor?: string;
  className?:  string;
}

export function Row({ icon, label, value, valueColor, className = '' }: RowProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2 shrink-0">
        <span aria-hidden style={{ color: 'var(--text-tertiary)', lineHeight: 1, fontSize: 14 }}>
          {icon}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <span className="font-black text-right"
        style={{ fontSize: 'var(--text-xs)', color: valueColor ?? 'var(--text-main)', maxWidth: '60%', lineHeight: 1.4 }}>
        {value}
      </span>
    </div>
  );
}