import { useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { AppLoader } from '@/components/AppLoader';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { useRouteTitle } from '@/lib/route-title';
import { useAuthSessionStore } from '@/stores/auth-session-store';
import { restoreSession } from './auth-session';
import type { ReturnToState } from './return-to';

function FullPageMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 font-sans text-ink">
      <div className="w-full max-w-[440px]">{children}</div>
    </div>
  );
}

export function RequireAuth() {
  const status = useAuthSessionStore((s) => s.status);
  const location = useLocation();
  const pageTitle = useRouteTitle();

  useEffect(() => {
    if (status === 'unknown') void restoreSession();
  }, [status]);

  if (status === 'authenticated') return <Outlet />;

  if (status === 'anonymous') {
    const state: ReturnToState = { from: `${location.pathname}${location.search}` };
    return <Navigate to="/login" replace state={state} />;
  }

  if (status === 'error') {
    return (
      <FullPageMessage>
        <div className="grid gap-4">
          <Callout title="We couldn’t check your sign-in">
            Seventh Vote didn’t respond. Check your connection and try again.
          </Callout>
          <Button fullWidth onClick={() => void restoreSession()}>
            Try again
          </Button>
        </div>
      </FullPageMessage>
    );
  }

  return <AppLoader page={pageTitle} label="Checking your sign-in…" />;
}
