'use client';
// 📁 components/layout/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full py-8 text-center font-cairo bg-transparent border-none" dir="rtl">
      {/* gap-1 للتحكم في المسافة بين السطرين (صغيرة جداً) */}
      <div className="max-w-xs mx-auto flex flex-col items-center gap-2">
        
        {/* السطر الأول: الروابط */}
        <nav className="flex justify-center gap-3 text-[9px] font-bold tracking-tighter">
          <Link 
            href="/privacy" 
            className="text-[var(--text-main)] opacity-60 active:opacity-100 transition-opacity"
          >
            الخصوصية
          </Link>
          <Link 
            href="/terms" 
            className="text-[var(--text-main)] opacity-60 active:opacity-100 transition-opacity"
          >
            الشروط
          </Link>
          <Link 
            href="/about" 
            className="text-[var(--text-main)] opacity-60 active:opacity-100 transition-opacity"
          >
            حول التطبيق
          </Link>
        </nav>

        {/* السطر الثاني: حقوق الملكية */}
        <p className="text-[8px] text-[var(--text-main)] opacity-70 font-sans tracking-widest uppercase">
          ZAWAJ AI by orcaPROD © 2026
        </p>
      </div>
    </footer>
  );
}