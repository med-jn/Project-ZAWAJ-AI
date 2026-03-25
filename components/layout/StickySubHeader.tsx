// 📁 components/layout/StickySubHeader.tsx
// شريط ثابت تحت PageHeader — المحتوى يتمرر تحته
interface Props {
  label:  string;
  count?: number;
}

export default function StickySubHeader({ label, count }: Props) {
  return (
    <div
      dir="rtl"
      style={{
        position:   'sticky',
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
        fontSize:   'var(--text-xl)',
        fontWeight: 900,
        color:      'var(--text-main)',
      }}>
        {label}
      </span>
      {!!count && count > 0 && (
        <span style={{
          fontSize:   'var(--text-xm)',
          fontWeight: 700,
          color:      'var(--color-primary)',
        }}>
          {count}
        </span>
      )}
    </div>
  );
}