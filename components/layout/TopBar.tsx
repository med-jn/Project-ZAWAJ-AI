'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Menu, X, Settings, Shield,
  Package, HelpCircle, FileText, LogOut, ChevronRight
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// الصفحات الرئيسية — لا تظهر زر الرجوع فيها
const MAIN_PAGES = ['/home', '/likes', '/notifications', '/profile', '/dash', '/subscribers'];

const MENU_ITEMS = [
  {
    group: 'الحساب',
    items: [
      { icon: Settings,  label: 'الإعدادات',          href: '/settings'  },
      { icon: Shield,    label: 'الأمان والخصوصية',   href: '/privacy'   },
      { icon: Package,   label: 'الباقات والاشتراكات', href: '/packages'  },
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

export default function TopBar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const router   = useRouter();
  const pathname = usePathname();
  const showBack = !MAIN_PAGES.includes(pathname);
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    router.push('/');
  };

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* ══════════════ الشريط العلوي ══════════════ */}
      <header
        dir="rtl"
        className="fixed top-0 right-0 left-0 h-16 z-[200] flex flex-row-reverse items-center justify-between px-4"
        style={{ background: 'transparent', backdropFilter: 'blur(20px)' }}
      >
        {/* ── يمين: سهم الرجوع + اسم التطبيق ── */}
        <div className="flex items-center gap-1">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-1.5 active:scale-90 transition-all"
            >
              <ChevronLeft
                size={26}
                className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1.0)]"
              />
            </button>
          )}
          <h1 className="text-xl font-black tracking-tighter select-none drop-shadow-[0_1px_1px_rgba(0,0,0,1.0)]">
            <span className="text-white">ZAWAJ </span>
            <span className="text-[#c0002a]">AI</span>
          </h1>
        </div>

        {/* ── يسار: ثلاث شرطات ── */}
        <button
          onClick={() => setOpen(true)}
          className="p-2 active:scale-90 transition-all"
        >
          <Menu size={26} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1.0)]" />
        </button>
      </header>

      {/* ══════════════ القائمة الجانبية ══════════════ */}
      <AnimatePresence>
        {open && (
          <>
            {/* طبقة الإغلاق */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1}}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300]"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
              onClick={() => setOpen(false)}
            />

            {/* اللوحة — تنزلق من اليسار لأن التطبيق RTL */}
            <motion.aside
              dir="rtl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 bottom-0 w-[300px] z-[400] flex flex-col"
              style={{
                background: 'rgba(8,0,8,0.98)',
                backdropFilter: 'blur(50px)',
                borderRight: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* هيدر اللوحة */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div>
                  <p className="text-white font-black text-lg">
                    ZAWAJ <span className="text-[#c0002a]">AI</span>
                  </p>
                  <p className="text-white/30 text-[11px] mt-0.5">مستقبل الزواج الذكي</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
                >
                  <X size={18} className="text-white/50" />
                </button>
              </div>

              {/* العناصر */}
              <nav className="flex-1 overflow-y-auto py-3">
                {MENU_ITEMS.map((group) => (
                  <div key={group.group} className="mb-4">
                    <p className="text-white/25 text-[9px] font-black tracking-[0.2em] uppercase px-6 py-2">
                      {group.group}
                    </p>
                    {group.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => go(item.href)}
                        className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-white/5 active:bg-white/10 transition-all group"
                      >
                        {/* أيقونة */}
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(192,0,42,0.12)',
                            border: '1px solid rgba(192,0,42,0.2)',
                          }}
                        >
                          <item.icon size={17} className="text-[#c0002a]" />
                        </div>

                        {/* النص */}
                        <span className="flex-1 text-right text-white/75 font-bold text-lg group-hover:text-white transition-colors">
                          {item.label}
                        </span>

                        {/* سهم */}
                        <ChevronLeft size={15} className="text-white/20 group-hover:text-white/40 transition-colors" />
                      </button>
                    ))}
                  </div>
                ))}
              </nav>

              {/* تسجيل الخروج */}
              <div className="px-6 pb-8 pt-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all active:scale-95 hover:opacity-90"
                  style={{
                    background: 'rgba(192,0,42,0.12)',
                    border: '1px solid rgba(192,0,42,0.3)',
                  }}
                >
                  <LogOut size={18} className="text-[#c0002a]" />
                  <span className="text-[#c0002a] font-black text-sm">تسجيل الخروج</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}