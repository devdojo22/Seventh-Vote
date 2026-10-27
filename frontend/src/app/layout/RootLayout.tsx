import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AppLoader } from '@/components/AppLoader';
import { useRouteTitle } from '@/lib/route-title';

const PAGE_LOADER_MS = 700;

export function RootLayout() {
  const { pathname } = useLocation();
  const title = useRouteTitle();
  const [settledPath, setSettledPath] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledPath(pathname), PAGE_LOADER_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <Outlet />
      {settledPath !== pathname && <AppLoader page={title} />}
    </>
  );
}
