'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft  } from 'lucide-react';

interface Props {
  title:    string;
  onBack?:  () => void;
  actions?: React.ReactNode;
  [key: string]: any;
}

export default function PageHeader({ title, onBack, actions, ...rest }: Props) {
  const router = useRouter();
  const back   = onBack ?? (() => router.back());

  return (
    <header
      {...rest}
      dir="rtl"
      style={{
        position:   'fixed',
        top: 0, right: 0, left: 0,
        zIndex:     1000,
        height:     'var(--header-h-safe)',
        display:    'flex',
        alignItems: 'flex-end',
        paddingBottom: 'var(--sp-2)',
        paddingLeft:  'var(--sp-2)',
        paddingRight: 'var(--sp-2)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <span style={{
        flex: 1,
        color:      'var(--text-main)',
        fontSize:   'var(--text-xl)',
        fontWeight: 800,
        paddingRight: 'var(--sp-2)',
      }}>
        {title}
      </span>

      {actions}

      <button
        onClick={back}
        style={{
          width:  'var(--btn-h)',
          height: 'var(--btn-h)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-full)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-main)',
          flexShrink: 0,
        }}
      >
        <ArrowLeft size={24} />
      </button>
    </header>
  );
}