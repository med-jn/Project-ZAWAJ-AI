'use client';
// 📁 components/layout/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      dir="rtl"
      style={{
        position: 'fixed',
        bottom: 0, 
        right: 0, 
        left: 0,
        zIndex: 1000,
        height: 'var(--header-h)', // نفس ارتفاع الهيدر ليتناسق التصميم
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-main)', // اللون الذي طلبته
        borderTop: '1px solid var(--glass-border)', // خط علوي بدل السفلي
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* الحاوية الداخلية للمحتوى */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        
        {/* السطر الأول: الروابط بنفس تفاصيلك الأصلية */}
        <nav style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
          <Link href="/privacy" style={{ fontSize: '8px', opacity: 0.7, color: 'var(--text-main)', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ fontSize: '8px', opacity: 0.7, color: 'var(--text-main)', textDecoration: 'none' }}>
            Terms
          </Link>
          <Link href="/help" style={{ fontSize: '8px', opacity: 0.7, color: 'var(--text-main)', textDecoration: 'none' }}>
            Help & Support
          </Link>
          <Link href="/about" style={{ fontSize: '8px', opacity: 0.7, color: 'var(--text-main)', textDecoration: 'none' }}>
            About
          </Link>
        </nav>

        {/* السطر الثاني: حقوق الملكية */}
        <p style={{ 
          margin: 0,
          fontSize: '7px', 
          color: 'var(--text-main)', 
          opacity: 0.7, 
          fontFamily: 'sans-serif', 
          letterSpacing: '0.1em', 
          textTransform: 'none' 
        }}>
          ZAWAJ AI by orcaPROD © 2026
        </p>
      </div>
    </footer>
  );
}