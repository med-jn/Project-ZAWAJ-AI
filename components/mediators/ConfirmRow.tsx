'use client';
/**
 * components/mediators/ConfirmRow.tsx
 *
 * Financial summary row used inside the subscription confirm panel.
 * Displays a label + a coin amount with optional sign prefix and bold styling.
 */

import { LoveCoin } from '@/components/ui/LoveCoin';

interface ConfirmRowProps {
  label:     string;
  value:     number;
  /** Display value as negative (red, minus sign) */
  isNeg?:    boolean;
  /** Display value as bold and larger (totals) */
  isBold?:   boolean;
  /** Explicitly show "+" prefix for positive values */
  showSign?: boolean;
}

export function ConfirmRow({
  label,
  value,
  isNeg    = false,
  isBold   = false,
  showSign = false,
}: ConfirmRowProps) {
  const display = Math.abs(value).toLocaleString('ar-TN');
  const prefix  = isNeg ? '−' : showSign && value > 0 ? '+' : '';
  const color   = isNeg   ? 'var(--color-primary)'
                : isBold  ? '#22c55e'
                :            'var(--text-main)';

  return (
    <div className="flex items-center justify-between">
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
        {label}
      </span>

      <span
        className={`flex items-center gap-1 ${isBold ? 'font-black' : 'font-bold'}`}
        style={{
          fontSize: isBold ? 'var(--text-base)' : 'var(--text-xs)',
          color,
        }}
      >
        {prefix}{display} <LoveCoin size={isBold ? 14 : 12} />
      </span>
    </div>
  );
}