export function Lbl({ t, err }: { t: string; err?: boolean }) {
  return (
    <p style={{
      fontSize: 'var(--text-2xs)',
      fontWeight: 800,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      marginBottom: 'var(--sp-2)',
      color: err ? 'var(--error-text)' : 'var(--text-secondary)',
      opacity: err ? 1 : 0.6,
    }}>{t}</p>
  );
}