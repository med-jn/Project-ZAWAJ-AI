'use client';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import TopBar from '@/components/layout/TopBar';

const ibm = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const AUTH_PAGES = ['/', '/login', '/register', '/onboarding'];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  const getActiveTab = () => {
    if (pathname.startsWith('/home')) return 'home';
    if (pathname.startsWith('/likes')) return 'likes';
    if (pathname.startsWith('/notifications')) return 'notifications';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/dash') || pathname.startsWith('/subscribers')) return 'mediator';
    return 'home';
  };

  const handleTabClick = (tab: string) => {
    const routes: Record<string, string> = {
      home: '/home',
      likes: '/likes',
      notifications: '/notifications',
      profile: '/profile',
      mediator: '/dash',
    };
    if (routes[tab]) router.push(routes[tab]);
  };

  return (
    <html lang="ar" dir="rtl" className={ibm.className}>
      <body
        style={{
          margin: 0,
          padding: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          background: '#080008',
        }}
      >
        {!isAuthPage && <TopBar />}
        <main
          style={{
            paddingTop: isAuthPage ? '0' : '64px',
            paddingBottom: isAuthPage ? '0' : '80px',
          }}
        >
          {children}
        </main>
        {!isAuthPage && (
          <Navbar
            activeTab={getActiveTab()}
            onTabClick={handleTabClick}
          />
        )}
      </body>
    </html>
  );
}