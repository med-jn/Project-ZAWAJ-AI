'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Navbar      from '@/components/layout/Navbar';
import PageHeader  from '@/components/layout/PageHeader';
import TopBar      from '@/components/layout/TopBar';
import MatchListener from '@/components/MatchListener';

import { useNativeAndroid }      from '@/hooks/useNativeAndroid';
import { useSystemScale }        from '@/hooks/useSystemScale';
import { usePushNotifications }  from '@/hooks/usePushNotifications';
import { supabase }              from '@/lib/supabase/client';

const AUTH_PAGES = ['/', '/login', '/register', '/onboarding'];

const PAGE_TITLES: Record<string, string> = {
  '/about':        'حول التطبيق',
  '/likes':        'الإعجابات',
  '/notifications':'الإشعارات',
  '/profile':      'الملف الشخصي',
  '/profile/edit': 'تعديل الملف',
  '/settings':     'الإعدادات',
  '/privacy':      'الخصوصية',
  '/mediators':    'الوسطاء',
  '/dash':         'لوحة التحكم',
  '/subscribers':  'المشتركون',
  '/points':       'نقاطي',
  '/help':         'المساعدة',
  '/terms':        'الشروط والسياسات',
};

function getTitle(path: string) {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  const match = Object.keys(PAGE_TITLES).find(k => path.startsWith(k + '/'));
  return match ? PAGE_TITLES[match] : '';
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) setUserId(data.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? undefined);
    });
    return () => subscription.unsubscribe();
  }, []);

  useNativeAndroid();
  useSystemScale();
  usePushNotifications(userId);

  const path = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname;

  const isAuth  = AUTH_PAGES.includes(path);
  const isHome  = path === '/home';
  // ✅ صفحة الشات تدير هيدرها وشريطها السفلي بنفسها
  const isChat  = path === '/chat' || path.startsWith('/chat');

  const title = getTitle(path);

  const getActiveTab = () => {
    if (path.startsWith('/home'))          return 'home';
    if (path.startsWith('/likes'))         return 'likes';
    if (path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/profile'))       return 'profile';
    if (path.startsWith('/dash'))          return 'profile';
    if (path.startsWith('/subscribers'))   return 'likes';
    if (path.startsWith('/mediators'))     return 'mediator';
    return 'home';
  };

  const showNavbar =
    path.startsWith('/home')          ||
    path.startsWith('/mediators')     ||
    path.startsWith('/dash')          ||
    path.startsWith('/subscribers')   ||
    path.startsWith('/likes')         ||
    path.startsWith('/notifications') ||
    path.startsWith('/profile')       ||
    path.startsWith('/points');

  return (
    <>
      {!isAuth && <MatchListener />}

      {/* الشات يدير هيدره بنفسه — لا TopBar ولا PageHeader */}
      {!isAuth && !isChat && isHome  && <TopBar />}
      {!isAuth && !isChat && !isHome && (
        <PageHeader title={title} onBack={() => router.back()} />
      )}

      <main
        style={{
          paddingTop: isAuth || isChat ? 0 : 'var(--header-h)',
          paddingBottom: isChat
            ? 0
            : showNavbar
            ? 'var(--nav-h-safe)'
            : 'var(--safe-bottom)',
          minHeight: '100vh',
          background: 'var(--bg-main)',
        }}
      >
        {children}
      </main>

      {showNavbar && !isChat && (
        <Navbar
          activeTab={getActiveTab()}
          onTabClick={route => router.push('/' + route)}
        />
      )}
    </>
  );
}