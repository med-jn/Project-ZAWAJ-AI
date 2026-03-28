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
  '/about': 'حول التطبيق',
  '/likes': 'الإعجابات',
  '/notifications': 'الإشعارات',
  '/profile': 'الملف الشخصي',
  '/settings': 'الإعدادات',
  '/privacy': 'الخصوصية',
  '/mediators': 'الوسطاء',
  '/dash': 'لوحة التحكم',
  '/subscribers': 'المشتركون',
};

function getTitle(path: string) {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  const match = Object.keys(PAGE_TITLES).find(k => path.startsWith(k + '/'));
  return match ? PAGE_TITLES[match] : '';
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isAuth = AUTH_PAGES.includes(pathname);
  const isHome = pathname === '/home';
  const isAbout = pathname === '/about';
  const title = getTitle(pathname);

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
    if (pathname.startsWith('/home')) return 'home';
    if (pathname.startsWith('/likes')) return 'likes';
    if (pathname.startsWith('/notifications')) return 'notifications';
    if (pathname.startsWith('/profile')) return 'profile';
    if (
      pathname.startsWith('/mediators') || 
      pathname.startsWith('/dash') || 
      pathname.startsWith('/subscribers')
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
      {!isAuth && !isHome && !!title && (
        <PageHeader title={title} onBack={() => router.back()} />
      )}

      <main style={{
        paddingTop: isAuth ? 0 : 'var(--header-h)',
        paddingBottom: (isAuth || isAbout) ? 0 : 'var(--nav-h)',
        minHeight: '100vh',
        background: 'var(--bg-main)'
      }}>
        {children}
      </main>

      {/* شريط التنقل السفلي (يختفي في صفحات تسجيل الدخول وعن التطبيق) */}
      {!isAuth && !isAbout && (
        <Navbar 
          activeTab={getActiveTab()} 
          onTabChange={(tab) => router.push(NAV_ROUTES[tab])} 
        />
      )}
    </>
  );
}