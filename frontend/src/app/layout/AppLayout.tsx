import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Disclaimer } from '@/components/Disclaimer';
import { MemberDrawer } from '@/features/chamber/MemberDrawer';
import { useCouncilLoader } from '@/features/council/use-council-loader';
import { describeAccessError } from '@/features/access/access-errors';
import { reloadCurrentUser } from '@/features/auth/auth-session';
import { useCurrentUser, useWorkspaceInSync } from '@/stores/auth-session-store';
import { MobileNav, Sidebar, WorkspaceBar } from './SideNav';
import { Toast } from './Toast';
import { TopBar } from './TopBar';

function WorkspaceSwitching() {
  const [error, setError] = useState<string | null>(null);
  const retry = () => {
    setError(null);
    reloadCurrentUser().catch((caught: unknown) => setError(describeAccessError(caught)));
  };
  return (
    <div className="mx-auto max-w-6xl space-y-3" aria-live="polite">
      <p className="text-sm text-muted">Switching workspace…</p>
      {error && (
        <p role="alert" className="text-sm text-brick">
          {error}{' '}
          <button type="button" className="cursor-pointer font-semibold underline" onClick={retry}>
            Try again
          </button>
        </p>
      )}
      {!error && (
        <button
          type="button"
          className="cursor-pointer text-xs font-semibold text-muted underline"
          onClick={retry}
        >
          Taking too long? Try again
        </button>
      )}
    </div>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const workspaceId = useCurrentUser().activeWorkspaceId;
  const inSync = useWorkspaceInSync();
  useCouncilLoader();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  const shownWorkspace = useRef(workspaceId);
  useEffect(() => {
    if (shownWorkspace.current === workspaceId) return;
    shownWorkspace.current = workspaceId;
    if (/^\/dossiers\/.+/.test(pathname)) void navigate('/dossiers', { replace: true });
  }, [workspaceId, pathname, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-navy px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <TopBar />
      <div className="flex w-full flex-1">
        <Sidebar />
        <main
          id="main"
          className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10 lg:pb-12"
        >
          <div className="mx-auto max-w-6xl">
            <WorkspaceBar />
          </div>
          {/* Keyed on the workspace too: a switch remounts the page, so it loads the new workspace's
              data and nothing from the previous one stays on screen or in a form. */}
          {inSync ? (
            <div
              key={`${workspaceId ?? 'none'}:${pathname}`}
              className="mx-auto max-w-6xl animate-fade-in"
            >
              <Outlet />
              <Disclaimer variant={pathname === '/dossiers' ? 'card' : 'line'} />
            </div>
          ) : (
            <WorkspaceSwitching />
          )}
        </main>
      </div>
      <MobileNav />
      <MemberDrawer />
      <Toast />
    </div>
  );
}
