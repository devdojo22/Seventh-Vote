import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { MemberDrawer } from '@/features/chamber/MemberDrawer';
import { useAppStore } from '@/stores/app-store';
import { MobileNav, Sidebar } from './SideNav';
import { TopBar } from './TopBar';

export function AppLayout() {
  const { pathname } = useLocation();
  const toast = useAppStore((s) => s.toast);

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
      <div className="mx-auto flex min-h-[calc(100vh-53px)] w-full max-w-[1380px] flex-1 flex-col lg:flex-row">
        <Sidebar />
        <main
          id="main"
          className="min-w-0 flex-1 px-3.5 py-6 pb-24 sm:px-6 sm:py-8.5 lg:px-9 lg:pb-16"
        >
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <MemberDrawer />
      {toast && (
        <div
          className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-white/20 bg-navy px-4 py-2.5 text-[13px] font-medium text-white shadow-xl lg:bottom-6"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
