'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import packageJson from '@/package.json';
import Navbar        from '@/components/layout/Navbar';
import PageHeader    from '@/components/layout/PageHeader';
import TopBar        from '@/components/layout/TopBar';
import MatchListener from '@/components/MatchListener';

// ── صفحات بدون أي أشرطة نهائياً ──────────────────────────
const AUTH_PAGES = ['/', '/login', '/register', '/onboarding'];

// ── أسماء الصفحات (أضفنا عنوان صفحة About هنا لتظهر في الهيدر) ──
const PAGE_TITLES: Record<string, string> = {
  '/about':         'حول التطبيق',
  '/likes':         'الإعجابات',
  '/notifications': 'الإشعارات',
  '/profile':       'الملف الشخصي',
  '/settings':      'الإعدادات',
  '/privacy':       'الخصوصية',
  '/mediators':     'الوسطاء',
  '/dash':          'لوحة التحكم',
  '/subscribers':   'المشتركون',
};

function getTitle(path: string) {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  const match = Object.keys(PAGE_TITLES).find(k => path.startsWith(k + '/'));
  return match ? PAGE_TITLES[match] : '';
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const currentVersion = packageJson.version;

  const isAuth   = AUTH_PAGES.includes(pathname);
  const isAbout  = pathname === '/about';
  const isHome   = pathname.startsWith('/home');
  const title    = getTitle(pathname);

  // ── رادار التحديثات ─────────────────────────────────────
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const res = await fetch('/update-info.json');        const data = await res.json();
        const latestVersion = data.version.replace('v', '');

        if (latestVersion !== currentVersion) {
          toast.info("تحديث جديد متاح", {
            description: `الإصدار (v${latestVersion}) متوفر الآن.`,
            action: {
              label: "تحديث الآن",
              onClick: () => router.push(`/about?v=${currentVersion}`)
            },
            duration: 8000,
          });
        }
      } catch (err) { /* فشل صامت */ }
    };
    const timer = setTimeout(checkUpdates, 5000);
    return () => clearTimeout(timer);
  }, [currentVersion, router]);

  const getActiveTab = () => {
    if (pathname.startsWith('/home'))          return 'home';
    if (pathname.startsWith('/likes'))         return 'likes';
    if (pathname.startsWith('/notifications')) return 'notifications';
    if (pathname.startsWith('/profile'))       return 'profile';
    if (pathname.startsWith('/mediators') || 
        pathname.startsWith('/dash')      || 
        pathname.startsWith('/subscribers'))   return 'mediator';
    return 'home';
  };

  const NAV_ROUTES: Record<string, string> = {
    home: '/home', likes: '/likes', notifications: '/notifications', profile: '/profile', mediator: '/mediators'
  };

  return (
    <>
      {/* الـ TopBar يظهر فقط في الرئيسية وليس في About */}
      {!isAuth && isHome && <TopBar data-top-bar />}

      {/* الـ PageHeader يظهر في About وفي الصفحات الداخلية الأخرى */}
      {!isAuth && !isHome && !!title && (
        <PageHeader title={title} onBack={() => router.back()} />
      )}

      <main style={{
        paddingTop:    isAuth ? 0 : 'var(--header-h)',
        paddingBottom: (isAuth || isAbout) ? 0 : 'var(--nav-h)', // إزالة البادينج السفلي في About
      }}>
        {children}
      </main>

      {/* الـ Navbar يختفي في صفحة About */}
      {!isAuth && !isAbout && (
        <Navbar
          activeTab={getActiveTab()}
          onTabClick={tab => NAV_ROUTES[tab] && router.push(NAV_ROUTES[tab])}
          data-bottom-nav
        />
      )}

      {!isAuth && <MatchListener />}
    </>
  );
}