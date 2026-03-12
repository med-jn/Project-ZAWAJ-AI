'use client';
// 📁 components/layout/StickySubHeader.tsx
// شريط ثابت تحت PageHeader يحمل اسم التبويب الحالي
// المحتوى يتمرر تحته — هو يبقى ثابتاً
interface StickySubHeaderProps {
  label:    string;   // اسم التبويب الحالي
  count?:   number;   // عدد العناصر (اختياري)
}

export default function StickySubHeader({ label, count }: StickySubHeaderProps) {
  return (
    <div
      dir="rtl"
      style={{
        position:   'sticky',
        // top = ارتفاع PageHeader الثابت
        top:        'var(--header-h)',
        zIndex:     900,
        background: 'var(--bg-main)',
        borderBottom: '1px solid var(--glass-border)',
        padding:    'var(--sp-3) var(--sp-4)',
        display:    'flex',
        alignItems: 'baseline',
        gap:        'var(--sp-2)',
      }}
    >
      <span style={{
        color:      'var(--text-main)',
        fontSize:   'var(--text-xl)',
        fontWeight: 900,
      }}>
        {label}
      </span>

      {count != null && count > 0 && (
        <span style={{
          color:      'var(--color-primary)',
          fontSize:   'var(--text-sm)',
          fontWeight: 700,
        }}>
          {count}
        </span>
      )}
    </div>
  );
}