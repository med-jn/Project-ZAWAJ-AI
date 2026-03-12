'use client';
// 📁 app/home/layout.tsx
// ✅ الأشرطة فقط هنا
// ✅ تختفي عند فتح أي modal عبر class="modal-open" على body
import { useRouter, usePathname } from 'next/navigation';
import Navbar  from '@/components/layout/Navbar';
import TopBar  from '@/components/layout/TopBar';
import MatchListener from '@/components/MatchListener';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname.startsWith('/home'))          return 'home';
    if (pathname.startsWith('/likes'))         return 'likes';
    if (pathname.startsWith('/notifications')) return 'notifications';
    if (pathname.startsWith('/profile'))       return 'profile';
    if (pathname.startsWith('/mediators') || pathname.startsWith('/dash') || pathname.startsWith('/subscribers')) return 'mediator';
    return 'home';
  };

  const handleTabClick = (tab: string) => {
    const routes: Record<string, string> = {
      home:          '/home',
      likes:         '/likes',
      notifications: '/notifications',
      profile:       '/profile',
      mediator:      '/mediators',
    };
    if (routes[tab]) router.push(routes[tab]);
  };

  return (
    <>
      <TopBar data-top-bar />

      <main style={{ paddingTop: '3.5rem', paddingBottom: '3.875rem' }}>
        {children}
      </main>

      <Navbar
        activeTab={getActiveTab()}
        onTabClick={handleTabClick}
        data-bottom-nav
      />

      <MatchListener />
    </>
  );
}