'use client';
// 📁 components/layout/PageHeader.tsx
import { useRouter } from 'next/navigation';
import { ArrowLeft  } from 'lucide-react';

interface Props {
  title:    string;
  onBack?:  () => void;
  actions?: React.ReactNode;
  [key: string]: any; // لقبول data-top-bar وغيره
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
        height:     'var(--header-h)',
        display:    'flex',
        alignItems: 'center',
        padding:    '0 var(--sp-2)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* اسم الصفحة — يمين */}
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

      {/* سهم الرجوع — يسار */}
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