'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Settings, Shield, ShieldCog, Package, UserPen, SlidersHorizontal,
  HelpCircle, FileText, LogOut, ChevronLeft, Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth/logout';
import { Brand } from '@/components/ui/brand';

const MENU_ITEMS = [
  {
    group: 'الحساب',
    items: [
      { icon: UserPen,          label: 'تعديل الملف',        href: '/profile/edit' },
      { icon: SlidersHorizontal, label: 'البحث المتقدم',      href: '/filter'       },
      { icon: ShieldCog,        label: 'الأمان والخصوصية',   href: '/security'     },
      { icon: Settings,         label: 'الإعدادات',          href: '/settings'     },
      { icon: Package,          label: 'رصيد النقاط',        href: '/points'       },
    ],
  },
  {
    group: 'الدعم والمعلومات',
    items: [
      { icon: Info,       label: 'حول التطبيق',      href: '/about'   },
      { icon: HelpCircle, label: 'المساعدة والدعم',  href: '/help'    },
      { icon: FileText,   label: 'شروط الاستخدام',  href: '/terms'   },
      { icon: Shield,     label: 'سياسة الخصوصية',  href: '/privacy' },
    ],
  },
];

export default function TopBar() {
  const router     = useRouter();
  const [open,       setOpen]       = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    setLoggingOut(true);
    try {
      await logout();
      router.push('/');
    } catch (_) {
      router.push('/');
    }
  };

  const go = (href: string) => { setOpen(false); router.push(href); };

  return (
    <>
      <header
        className="fixed top-0 right-0 left-0 z-[200] flex items-center justify-between px-4 flex-row-reverse"
        style={{
          paddingTop:  'var(--safe-top)',
          height:      'var(--header-h-safe)',
          backdropFilter: 'blur(10px)',
          background:  'transparent',
        }}
      >
        <div className="scale-[0.65] origin-left -mb-2">
          <Brand />
        </div>

        <motion.button whileTap={{ scale: 0.88 }} onClick={() => setOpen(true)} className="p-2">
          <Menu size="1.5em" className="text-white" strokeWidth={2} />
        </motion.button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300]"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              dir="rtl"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-[280px] z-[400] flex flex-col"
              style={{ background: 'var(--bg-elevated)', borderLeft: '1px solid var(--glass-border)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5"
                style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <div className="scale-50 origin-right">
                  <Brand />
                </div>
                <button onClick={() => setOpen(false)} style={{ color: 'var(--text-tertiary)' }}>
                  <X size="1.2em" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto py-2">
                {MENU_ITEMS.map((group) => (
                  <div key={group.group} className="mb-4">
                    <p style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
                      textTransform: 'uppercase', padding: '8px 24px 4px',
                      color: 'var(--text-tertiary)', opacity: 0.5, margin: 0,
                    }}>
                      {group.group}
                    </p>
                    {group.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => go(item.href)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center',
                          gap: 12, padding: '13px 24px',
                          background: 'transparent', border: 'none',
                          cursor: 'pointer', fontFamily: 'inherit',
                          fontSize: 'var(--text-sm)', fontWeight: 700,
                          color: 'var(--text-main)',
                        }}
                      >
                        <item.icon
                          size="1.15em"
                          style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                          strokeWidth={2}
                        />
                        <span style={{ flex: 1, textAlign: 'right', lineHeight: 1 }}>
                          {item.label}
                        </span>
                        <ChevronLeft size="0.9em" style={{ color: 'var(--text-tertiary)', opacity: 0.25 }} />
                      </button>
                    ))}
                  </div>
                ))}
              </nav>

              {/* Logout — مسافة آمنة من شريط التنقل */}
              <div style={{
                padding: '16px 24px',
                paddingBottom: 'calc(16px + var(--nav-h, 64px) + var(--safe-bottom, 0px))',
                borderTop: '1px solid var(--glass-border)',
              }}>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    padding: '14px 0', borderRadius: 16,
                    background: 'rgba(248,113,113,0.10)',
                    border: '1px solid rgba(248,113,113,0.2)',
                    color: '#f87171', fontWeight: 700,
                    fontSize: 'var(--text-sm)', fontFamily: 'inherit',
                    cursor: loggingOut ? 'not-allowed' : 'pointer',
                    opacity: loggingOut ? 0.6 : 1,
                  }}
                >
                  {loggingOut
                    ? <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(248,113,113,0.3)', borderTopColor: '#f87171' }}
                      />
                    : <><LogOut size="1.1em" strokeWidth={2} /><span>تسجيل الخروج</span></>
                  }
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}