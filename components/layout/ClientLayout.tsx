'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import * as LiveUpdates from '@capacitor/live-updates';
import { PackagePlus } from 'lucide-react';
import packageJson from '@/package.json';

import Navbar from '@/components/layout/Navbar';
import PageHeader from '@/components/layout/PageHeader';
import TopBar from '@/components/layout/TopBar';
import MatchListener from '@/components/MatchListener';

const AUTH_PAGES = ['/', '/login', '/register', '/onboarding'];

const PAGE_TITLES: Record<string, string> = {
  '/about':         'حول التطبيق',
  '/likes':         'الإعجابات',
  '/notifications': 'الإشعارات',
  '/profile':       'الملف الشخصي',
  '/profile/edit':  'تعديل الملف',
  '/settings':      'الإعدادات',
  '/privacy':       'الخصوصية',
  '/mediators':     'الوسطاء',
  '/dash':          'لوحة التحكم',
  '/subscribers':   'المشتركون',
  '/packages':      'المتجر',
  '/packages/history': 'سجل المعاملات',
  '/help':          'المساعدة',
  '/terms':         'الشروط والسياسات',
};

function getTitle(path: string) {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  const match = Object.keys(PAGE_TITLES).find(k => path.startsWith(k + '/'));
  return match ? PAGE_TITLES[match] : '';
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // تطبيع المسار — إزالة الـ / في النهاية
  const path   = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  const isAuth = AUTH_PAGES.includes(path);
  const isHome = path === '/home';
  const isAbout = path === '/about';
  const title = getTitle(path);

  useEffect(() => {
    const handleUpdateSystem = async () => {
      // التأكد من أننا على هاتف أندرويد/iOS وليس المتصفح
      if (!Capacitor.isNativePlatform()) return;

      try {
        // فحص ومزامنة التحديثات بناءً على updateUrl المذكور في capacitor.config.ts
        const result = await LiveUpdates.sync();

        if (result.next) {
          // عرض إشعار للمستخدم بوجود نسخة جديدة
          toast.info("تحديث جديد متاح", {
            description: "جاري تحميل النسخة الجديدة لتحسين الأداء...",
            icon: <PackagePlus size={18} />,
            duration: 6000,
            action: {
              label: "تحديث الآن",
              onClick: () => LiveUpdates.reload()
            }
          });

          // يمكنك اختيار التثبيت التلقائي الصامت هنا
          // await LiveUpdates.reload();
        }
      } catch (err) {
        console.warn("Update System: Check skipped (No connection or Dev mode)");
      }
    };

    // تشغيل الفحص بعد ثانية من فتح التطبيق لضمان استقرار الاتصال
    const timer = setTimeout(handleUpdateSystem, 1500);
    return () => clearTimeout(timer);
  }, []);

  const getActiveTab = () => {
    if (path.startsWith('/home')) return 'home';
    if (path.startsWith('/likes')) return 'likes';
    if (path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/profile')) return 'profile';
    if (
      path.startsWith('/mediators') || 
      path.startsWith('/dash') || 
      path.startsWith('/subscribers')
    ) return 'mediator';
    return 'home';
  };

  const NAV_ROUTES: Record<string, string> = {
    home: '/home', 
    likes: '/likes', 
    notifications: '/notifications', 
    profile: '/profile', 
    mediator: '/mediators'
  };

  return (
    <>
      {/* استماع لتنبيهات المطابقة (Match) */}
      {!isAuth && <MatchListener />}

      {/* شريط التوب بار (يظهر في الصفحة الرئيسية فقط) */}
      {!isAuth && isHome && <TopBar />}

      {/* شريط العنوان (يظهر في الصفحات الداخلية فقط) */}
      {!isAuth && !isHome && (
        <PageHeader title={title} onBack={() => router.back()} />
      )}

      <main style={{
        paddingTop: isAuth ? 0 : 'var(--header-h)',
        paddingBottom: (isHome || path.startsWith('/mediators') || path.startsWith('/dash') || path.startsWith('/subscribers') || path.startsWith('/likes') || path.startsWith('/notifications') || path.startsWith('/profile')) ? 'var(--nav-h)' : 0,
        minHeight: '100vh',
        background: 'var(--bg-main)'
      }}>
        {children}
      </main>

      {/* شريط التنقل السفلي — home و mediators و dash و subscribers */}
      {(isHome || path.startsWith('/mediators') || path.startsWith('/dash') || path.startsWith('/subscribers') || path.startsWith('/likes') || path.startsWith('/notifications') || path.startsWith('/profile')) && (
        <Navbar 
          activeTab={getActiveTab()} 
          onTabClick={(tab) => router.push(NAV_ROUTES[tab])} 
        />
      )}
    </>
  );
}