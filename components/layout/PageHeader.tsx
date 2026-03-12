'use client';
// 📁 components/layout/PageHeader.tsx
// شريط علوي موحّد لكل الواجهات الداخلية
// اسم الصفحة يمين — سهم الرجوع يسار
import { useRouter } from 'next/navigation';
import { ArrowLeft  } from 'lucide-react';

interface PageHeaderProps {
  title:      string;
  onBack?:    () => void;   // اختياري — إذا لم يُمرَّر يرجع للخلف تلقائياً
  actions?:   React.ReactNode; // أيقونات إضافية يسار (اختياري)
}

export default function PageHeader({ title, onBack, actions }: PageHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <header
      data-top-bar
      dir="rtl"
      style={{
        position:   'fixed',
        top: 0, right: 0, left: 0,
        zIndex:     1000,
        height:     'var(--header-h)',
        minHeight:  'var(--header-h)',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding:    '0 var(--sp-4)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* اسم الصفحة — يمين */}
      <span style={{
        color:      'var(--text-main)',
        fontSize:   'var(--text-lg)',
        fontWeight: 800,
        flex: 1,
      }}>
        {title}
      </span>

      {/* أيقونات إضافية اختيارية */}
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginLeft: 'var(--sp-2)' }}>
          {actions}
        </div>
      )}

      {/* سهم الرجوع — يسار */}
      <button
        onClick={handleBack}
        style={{
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width:      'var(--btn-h)',
          height:     'var(--btn-h)',
          borderRadius: 'var(--radius-full)',
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          color:      'var(--text-main)',
          flexShrink: 0,
          marginRight: 'calc(var(--sp-2) * -1)', // محاذاة بصرية
        }}
      >
        <ArrowLeft size="var(--icon-lg)" />
      </button>
    </header>
  );
}