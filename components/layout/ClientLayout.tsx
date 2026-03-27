'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
  const isAbout = pathname === '/about';
  const isHome = pathname.startsWith('/home');
  const title = getTitle(pathname);

  useEffect(() => {
    const handleUpdateSystem = async () => {
      try {
        // البحث عن تحديثات باستخدام المكتبة الرسمية
        const result = await LiveUpdates.sync();
        
        // في حال وجود نسخة جديدة (Next)
        if (result.next) {
          toast.info("تحديث متاح", {
            description: "يتم الآن تحميل الإصدار الجديد تلقائياً لتحسين تجربتك.",
            duration: 8000,
            icon: <PackagePlus className="w-5 h-5 text-[var(--color-primary)]" />,
            action: {
              label: "تطبيق الآن",
              onClick: () => LiveUpdates.reload()
            }
          });
        }
      } catch (err) {
        // فشل صامت في حال عدم توفر اتصال
      }
    };

    handleUpdateSystem();
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
      {!isAuth && isHome && <TopBar />}

      {!isAuth && !isHome && !!title && (
        <PageHeader title={title} onBack={() => router.back()} />
      )}

      <main style={{
        paddingTop: isAuth ? 0 : 'var(--header-h)',
        paddingBottom: (isAuth || isAbout) ? 0 : 'var(--nav-h)',
      }}>
        {children}
      </main>

      {!isAuth && !isAbout && (
        <Navbar
          activeTab={getActiveTab()}
          onTabClick={tab => NAV_ROUTES[tab] && router.push(NAV_ROUTES[tab])}
        />
      )}

      {!isAuth && <MatchListener />}
    </>
  );
}