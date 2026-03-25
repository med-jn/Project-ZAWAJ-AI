'use client';
/**
 * 📁 components/layout/ClientLayout.tsx — ZAWAJ AI
 * ✅ Client Component — يحتوي كل ما يحتاج usePathname / useRouter
 * ✅ يُصدّر useTheme hook للاستخدام في أي مكوّن
 * ✅ منفصل عن layout.tsx (Server Component) لأفضل أداء
 */

import { usePathname, useRouter } from 'next/navigation';
import Navbar        from '@/components/layout/Navbar';
import PageHeader    from '@/components/layout/PageHeader';
import TopBar        from '@/components/layout/TopBar';
import MatchListener from '@/components/MatchListener';

// ── صفحات بدون أي أشرطة ──────────────────────────────────────
const AUTH_PAGES = ['/', '/login', '/register', '/onboarding'];

// ── أسماء الصفحات ─────────────────────────────────────────────
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

// ── المكوّن ───────────────────────────────────────────────────
export default function ClientLayout({ children }: { children: React.ReactNode }) {
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
        pathname.startsWith('/dash')       ||
        pathname.startsWith('/subscribers'))   return 'mediator';
    return 'home';
  };

  const NAV_ROUTES: Record<string, string> = {
    home:          '/home',
    likes:         '/likes',
    notifications: '/notifications',
    profile:       '/profile',
    mediator:      '/mediators',
  };

  return (
    <>
      {/* الرئيسية — TopBar الخاص */}
      {!isAuth && isHome && <TopBar data-top-bar />}

      {/* صفحات داخلية — PageHeader ذكي */}
      {!isAuth && !isHome && !!title && (
        <PageHeader title={title} onBack={() => router.back()} />
      )}

      <main style={{
        paddingTop:    isAuth ? 0 : 'var(--header-h)',
        paddingBottom: isAuth ? 0 : 'var(--nav-h)',
      }}>
        {children}
      </main>

      {/* Navbar */}
      {!isAuth && (
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