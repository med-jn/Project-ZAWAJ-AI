'use client';
/**
 * TopBar — ZAWAJ AI
 * Layout RTL:
 * [← سهم] [ZAWAJ AI]  ............  [☰]
 *  أقصى يسار                         أقصى يمين
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Settings, Shield, Package,
  HelpCircle, FileText, LogOut, ChevronLeft,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const MAIN_PAGES = ['/home', '/likes', '/notifications', '/profile', '/dash', '/subscribers'];

const MENU_ITEMS = [
  {
    group: 'الحساب',
    items: [
      { icon: Settings,   label: 'الإعدادات',           href: '/settings' },
      { icon: Shield,     label: 'الأمان والخصوصية',    href: '/privacy'  },
      { icon: Package,    label: 'الباقات والاشتراكات',  href: '/packages' },
    ],
  },
  {
    group: 'الدعم',
    items: [
      { icon: HelpCircle, label: 'المساعدة والدعم',    href: '/help'  },
      { icon: FileText,   label: 'الشروط والسياسات',   href: '/terms' },
    ],
  },
];

export default function TopBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const showBack = !MAIN_PAGES.includes(pathname);
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    router.push('/');
  };

  const go = (href: string) => { setOpen(false); router.push(href); };

  return (
    <>
      {/* ══ الشريط العلوي ══
          لا dir="rtl" هنا — نتحكم يدوياً بالـ flex
          اليسار: سهم + اسم | اليمين: ☰
      */}
      <header
        className="fixed top-0 right-0 left-0 h-16 z-[200] flex items-center justify-between px-4"
        style={{ backdropFilter: 'blur(5px)', background: 'transparent' }}
      >
        {/* أقصى اليسار: سهم ملاصق للاسم */}
        <div className="flex items-center gap-0.5">
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => router.back()}
              className="flex items-center justify-center w-8 h-8"
            >
              <ChevronLeft
                size={24}
                className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)]"
              />
            </motion.button>
          )}

          {/* الاسم — قابل للنقر للرجوع للرئيسية */}
          <button
            onClick={() => router.push('/home')}
            className="select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          >
            <span className="text-xl font-black tracking-tighter text-white">ZAWAJ </span>
            <span className="text-xl font-black tracking-tighter" style={{ color: '#c0002a' }}>AI</span>
          </button>
        </div>

        {/* أقصى اليمين: الهمبرغر */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setOpen(true)}
          className="p-2"
        >
          <Menu
            size={26}
            className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)]"
          />
        </motion.button>
      </header>

      {/* ══ القائمة الجانبية — تنزلق من اليمين ══ */}
      <AnimatePresence>
        {open && (
          <>
            {/* طبقة الإغلاق */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300]"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
              onClick={() => setOpen(false)}
            />

            {/* اللوحة من اليمين — RTL → right-0 */}
            <motion.aside
              dir="rtl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] z-[400] flex flex-col"
              style={{
                background: 'var(--bg-elevated) 50%',
                backdropFilter: 'blur(10px)',
                borderLeft: '1px solid var(--border-medium)',
              }}
            >
              {/* هيدر */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div>
                  <p className="text-white font-black text-lg">
                    ZAWAJ <span style={{ color: '#c0002a' }}>AI</span>
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    مستقبل الزواج الذكي
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <X size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </button>
              </div>

              {/* عناصر القائمة */}
              <nav className="flex-1 overflow-y-auto py-3">
                {MENU_ITEMS.map((group) => (
                  <div key={group.group} className="mb-4">
                    <p
                      className="text-[9px] font-black tracking-[0.2em] uppercase px-6 py-2"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      {group.group}
                    </p>
                    {group.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => go(item.href)}
                        className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 active:bg-white/10 transition-all group"
                      >
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(192,0,42,0.12)', border: '1px solid rgba(192,0,42,0.2)' }}
                        >
                          <item.icon size={17} style={{ color: '#c0002a' }} />
                        </div>
                        <span
                          className="flex-1 text-right font-bold text-sm group-hover:text-white transition-colors"
                          style={{ color: 'var(--text-on-primary)' }}
                        >
                          {item.label}
                        </span>
                        <ChevronLeft size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      </button>
                    ))}
                  </div>
                ))}
              </nav>

              {/* تسجيل الخروج */}
              <div className="px-6 pb-8 pt-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all active:scale-95"
                  style={{ background: 'rgba(192,0,42,0.1)', border: '1px solid rgba(192,0,42,0.25)' }}
                >
                  <LogOut size={18} style={{ color: '#c0002a' }} />
                  <span className="font-black text-sm" style={{ color: '#c0002a' }}>
                    تسجيل الخروج
                  </span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}