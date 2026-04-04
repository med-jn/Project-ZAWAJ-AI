'use client';

import { useEffect }                from 'react';
import { usePathname, useRouter }   from 'next/navigation';
import { toast }                    from 'sonner';
import { PackagePlus }              from 'lucide-react';
import { checkAndApplyUpdate }      from '@/lib/services/liveUpdate';
import { useNativeAndroid }         from '@/hooks/useNativeAndroid';

import Navbar        from '@/components/layout/Navbar';
import PageHeader    from '@/components/layout/PageHeader';
import TopBar        from '@/components/layout/TopBar';
import MatchListener from '@/components/MatchListener';
import { PushNotifications } from '@capacitor/push-notifications';

const requestPermissions = async () => {
  let permStatus = await PushNotifications.checkPermissions();
  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }
  if (permStatus.receive !== 'granted') throw new Error('User denied permissions!');
  await PushNotifications.register();
};

const AUTH_PAGES = ['/', '/login', '/register', '/onboarding'];

const PAGE_TITLES: Record<string, string> = {
  '/about':            'حول التطبيق',
  '/likes':            'الإعجابات',
  '/notifications':    'الإشعارات',
  '/profile':          'الملف الشخصي',
  '/profile/edit':     'تعديل الملف',
  '/settings':         'الإعدادات',
  '/privacy':          'الخصوصية',
  '/mediators':        'الوسطاء',
  '/dash':             'لوحة التحكم',
  '/subscribers':      'المشتركون',
  '/packages':         'المتجر',
  '/packages/history': 'سجل المعاملات',
  '/help':             'المساعدة',
  '/terms':            'الشروط والسياسات',
};

function getTitle(path: string) {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  const match = Object.keys(PAGE_TITLES).find(k => path.startsWith(k + '/'));
  return match ? PAGE_TITLES[match] : '';
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  useNativeAndroid();

  const path   = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  const isAuth = AUTH_PAGES.includes(path);
  const isHome = path === '/home';
  const title  = getTitle(path);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await checkAndApplyUpdate();
      if (result.hasUpdate) {
        toast.info(`تحديث v${result.version} جاهز`, {
          description: 'سيُطبَّق التحديث عند إعادة فتح التطبيق',
          icon: <PackagePlus size={18} />,
          duration: 8000,
          action: {
            label:   'إعادة التشغيل',
            onClick: () => window.location.reload(),
          },
        });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getActiveTab = () => {
    if (path.startsWith('/home'))          return 'home';
    if (path.startsWith('/likes'))         return 'likes';
    if (path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/profile'))       return 'profile';
    if (
      path.startsWith('/mediators') ||
      path.startsWith('/dash')      ||
      path.startsWith('/subscribers')
    ) return 'mediator';
    return 'home';
  };

  const NAV_ROUTES: Record<string, string> = {
    home: '/home', likes: '/likes',
    notifications: '/notifications',
    profile: '/profile', mediator: '/mediators',
  };

  const showNavbar =
    path.startsWith('/home')          ||
    path.startsWith('/mediators')     ||
    path.startsWith('/dash')          ||
    path.startsWith('/subscribers')   ||
    path.startsWith('/likes')         ||
    path.startsWith('/notifications') ||
    path.startsWith('/profile');

  return (
    <>
      {!isAuth && <MatchListener />}
      {!isAuth && isHome  && <TopBar />}
      {!isAuth && !isHome && <PageHeader title={title} onBack={() => router.back()} />}

      <main style={{
        paddingTop: isAuth ? 0 : 'var(--header-h)',
        paddingBottom: (
          isHome                        ||
          path.startsWith('/mediators') ||
          path.startsWith('/dash')      ||
          path.startsWith('/subscribers')
        ) ? 'var(--nav-h)' : 0,
        minHeight: '100vh',
        background: 'var(--bg-main)',
      }}>
        {children}
      </main>

      {showNavbar && (
        <Navbar
          activeTab={getActiveTab()}
          onTabClick={(tab) => router.push(NAV_ROUTES[tab])}
        />
      )}
    </>
  );
}