'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Settings, Shield, Package,
  HelpCircle, FileText, LogOut, ChevronLeft, Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Brand } from '@/components/ui/brand';

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
    group: 'الدعم والمعلومات',
    items: [
      { icon: Info,       label: 'حول التطبيق',        href: '/about'    },
      { icon: HelpCircle, label: 'المساعدة والدعم',    href: '/help'     },
      { icon: FileText,   label: 'الشروط والسياسات',   href: '/terms'    },
    ],
  },
];

export default function TopBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    router.push('/');
  };

  const go = (href: string) => { setOpen(false); router.push(href); };

  return (
    <>
      <header
        className="fixed top-0 right-0 left-0 h-[var(--header-h)] z-[200] flex items-center justify-between px-4 flex-row-reverse"
        style={{ backdropFilter: 'blur(10px)', background: 'transparent' }}
      >
        <div className="flex items-center">
          <button onClick={() => router.push('/home')} className="active:scale-95 transition-transform">
            <div className="scale-50 origin-center -mb-4">
          <Brand />
        </div>
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setOpen(true)}
          className="p-2"
        >
          <Menu size="1.5em" className="text-white" strokeWidth={2} />
        </motion.button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300]"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              dir="rtl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-[280px] z-[400] flex flex-col"
              style={{ background: 'var(--bg-elevated)', borderLeft: '1px solid var(--glass-border)' }}
            >
              <div className="flex items-center justify-between px-6 py-6 border-b border-[var(--glass-border)]">
                <div className="scale-50 origin-center -mb-4">
          <Brand />
        </div>
                <button onClick={() => setOpen(false)} className="text-[var(--text-tertiary)]">
                  <X size="1.2em" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4">
                {MENU_ITEMS.map((group) => (
                  <div key={group.group} className="mb-6">
                    <p className="text-[10px] font-bold tracking-widest uppercase px-6 py-2 text-[var(--text-tertiary)] opacity-50">
                      {group.group}
                    </p>
                    {group.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => go(item.href)}
                        className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-[var(--bg-soft)] transition-colors group text-sm font-bold text-[var(--text-main)]"
                      >
                        <item.icon 
                          size="1.2em" 
                          className="text-[var(--color-primary)] flex-shrink-0" 
                          strokeWidth={2} 
                          fill="none" 
                        />
                        <span className="flex-1 text-right leading-none">
                          {item.label}
                        </span>
                        <ChevronLeft size="1em" className="text-[var(--text-tertiary)] opacity-20" />
                      </button>
                    ))}
                  </div>
                ))}
              </nav>

              <div className="px-6 pb-10 pt-4 border-t border-[var(--glass-border)]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 text-red-500 active:scale-95 transition-all text-sm font-bold"
                >
                  <LogOut size="1.2em" strokeWidth={2} fill="none" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}