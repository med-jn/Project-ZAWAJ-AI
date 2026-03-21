'use client';
// 📁 app/layout.tsx
import { Cairo } from 'next/font/google';
import './globals.css';
import { usePathname, useRouter } from 'next/navigation';
import Navbar        from '@/components/layout/Navbar';
import PageHeader    from '@/components/layout/PageHeader';
import TopBar        from '@/components/layout/TopBar';
import MatchListener from '@/components/MatchListener';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

// ── صفحات بدون أي أشرطة ──────────────────────────────────────
const AUTH_PAGES = ['/', '/login', '/register', '/onboarding'];

// ── أسماء الصفحات — أضف أي صفحة جديدة هنا فقط ───────────────
const PAGE_TITLES: Record<string, string> = {
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const isAuth = AUTH_PAGES.includes(pathname);
  const isHome = pathname.startsWith('/home');
  const title  = getTitle(pathname);

  const getActiveTab = () => {
    if (pathname.startsWith('/home'))          return 'home';
    if (pathname.startsWith('/likes'))         return 'likes';
    if (pathname.startsWith('/notifications')) return 'notifications';
    if (pathname.startsWith('/profile'))       return 'profile';
    if (pathname.startsWith('/mediators') ||
        pathname.startsWith('/dash') ||
        pathname.startsWith('/subscribers'))   return 'mediator';
    return 'home';
  };

  const NAV_ROUTES: Record<string, string> = {
    home: '/home', likes: '/likes',
    notifications: '/notifications',
    profile: '/profile', mediator: '/mediators',
  };

  return (
    <html lang="ar" dir="rtl" className={cairo.className}>
      <body style={{ margin: 0, padding: 0, overflowX: 'hidden' }}>

        {/* الرئيسية — TopBar الخاص */}
        {!isAuth && isHome && <TopBar data-top-bar />}

        {/* صفحات داخلية — PageHeader ذكي تلقائي */}
        {!isAuth && !isHome && !!title && (
          <PageHeader title={title} onBack={() => router.back()} />
        )}

        <main style={{
          paddingTop:    isAuth ? 0 : 'var(--header-h)',
          paddingBottom: isAuth ? 0 : 'var(--nav-h)',
        }}>
          {children}
        </main>

        {/* Navbar — في كل مكان عدا Auth وعدا نافذة الدردشة */}
        {!isAuth && (
          <Navbar
            activeTab={getActiveTab()}
            onTabClick={tab => NAV_ROUTES[tab] && router.push(NAV_ROUTES[tab])}
            data-bottom-nav
          />
        )}

        {!isAuth && <MatchListener />}

      </body>
    </html>
  );
}