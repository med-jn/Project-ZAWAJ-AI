export default function FilterLbl({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: 'var(--text-2xs)', fontWeight: 800,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--text-tertiary)', margin: '0 0 var(--sp-2)',
    }}>{text}</p>
  );
}