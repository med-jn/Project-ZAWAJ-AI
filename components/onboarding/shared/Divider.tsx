export default function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
      <span style={{
        fontSize: 'var(--text-2xs)', fontWeight: 900, letterSpacing: '0.28em',
        color: 'var(--color-primary)', opacity: 0.8, textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
    </div>
  );
}