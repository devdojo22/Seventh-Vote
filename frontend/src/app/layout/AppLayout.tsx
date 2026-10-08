import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Disclaimer } from '@/components/Disclaimer';
import { MemberDrawer } from '@/features/chamber/MemberDrawer';
import { MobileNav, Sidebar } from './SideNav';
import { Toast } from './Toast';
import { TopBar } from './TopBar';

export function AppLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-navy px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <TopBar />
      <div className="mx-auto flex w-full max-w-[1380px] flex-1">
        <Sidebar />
        <main
          id="main"
          className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10 lg:pb-12"
        >
          <div key={pathname} className="mx-auto max-w-6xl animate-fade-in">
            <Outlet />
            <Disclaimer />
          </div>
        </main>
      </div>
      <MobileNav />
      <MemberDrawer />
      <Toast />
    </div>
  );
}
