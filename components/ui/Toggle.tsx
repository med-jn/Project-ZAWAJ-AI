'use client';

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ value, onChange, disabled = false, size = 'md' }: ToggleProps) {
  const isSmall = size === 'sm';

  // أبعاد ثابتة بالـ px لتجنب أي تأثير من RTL
  const W  = isSmall ? 36 : 44;   // عرض الزر
  const H  = isSmall ? 20 : 24;   // ارتفاع الزر
  const D  = isSmall ? 14 : 18;   // قطر الكرة
  const P  = 2;                    // padding داخلي
  // الكرة: يسار عند OFF، يمين عند ON — بـ left دائماً (لا تتأثر بـ RTL)
  const ballLeft = value ? W - D - P : P;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      style={{
        position: 'relative',
        display: 'inline-block',
        flexShrink: 0,
        width:  W,
        height: H,
        borderRadius: 9999,
        border: `1.5px solid ${value ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)'}`,
        background: value
          ? 'linear-gradient(135deg, var(--color-primary-hover), var(--color-primary))'
          : 'rgba(255,255,255,0.06)',
        boxShadow: value
          ? '0 0 10px var(--shadow-red-glow), inset 0 1px 2px rgba(255,255,255,0.15)'
          : 'inset 0 1px 3px rgba(0,0,0,0.3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        padding: 0,
        // مهم: نمنع RTL من عكس أي شيء داخل الزر
        direction: 'ltr',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: ballLeft,           // ← left دائماً، لا right، لا translateX
          transform: 'translateY(-50%)',
          width:  D,
          height: D,
          borderRadius: '50%',
          background: value ? '#ffffff' : 'rgba(255,255,255,0.45)',
          boxShadow: value
            ? '0 2px 6px rgba(0,0,0,0.35)'
            : '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s',
        }}
      />
    </button>
  );
}