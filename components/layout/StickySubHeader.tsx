// 📁 components/layout/StickySubHeader.tsx
interface Props {
  label:    string;          // اسم التبويب/القسم الحالي
  count?:   number;          // عدد اختياري
  children?: React.ReactNode; // تبويبات أو أزرار إضافية
}

export default function StickySubHeader({ label, count, children }: Props) {
  return (
    <div
      dir="rtl"
      style={{
        position:     'sticky',
        top:          'var(--header-h)',
        zIndex:       900,
        background:   'var(--bg-surface)',
        borderBottom: '1px solid var(--glass-border)',
        padding:      'var(--sp-2) var(--sp-4)',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        gap:          'var(--sp-2)',
        minHeight:    'calc(var(--header-h) * 0.75)',
      }}
    >
      {/* يسار: اسم التبويب + العدد */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)' }}>
        <span style={{
          fontSize:   'var(--text-sm)',   // أصغر من PageHeader (--text-lg)
          fontWeight: 700,
          color:      'var(--text-secondary)',
        }}>
          {label}
        </span>
        {!!count && count > 0 && (
          <span style={{
            fontSize:   'var(--text-2xs)',
            fontWeight: 800,
            color:      'var(--color-primary)',
            background: 'var(--color-primary-xsoft)',
            padding:    '1px var(--sp-2)',
            borderRadius: 'var(--radius-full)',
          }}>
            {count}
          </span>
        )}
      </div>

      {/* يمين: تبويبات أو أزرار اختيارية */}
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          {children}
        </div>
      )}
    </div>
  );
}