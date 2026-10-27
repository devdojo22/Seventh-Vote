import { ApiError } from '@/lib/api/http';
import { useAuthSessionStore } from '@/stores/auth-session-store';
import { useInvitationStore } from '@/stores/invitation-store';
import { usePrepStore } from '@/stores/prep-store';
import { useSessionStore } from '@/stores/session-store';
import { useVerificationChallengeStore } from '@/stores/verification-challenge-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  changePassword,
  fetchCurrentUser,
  logoutSession,
  refreshSession,
  switchWorkspace,
  type ChangePasswordRequest,
  type SessionResponse,
} from './auth-api';

export function isSessionRejected(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

class StaleSessionError extends Error {
  override readonly name = 'StaleSessionError';
}

const currentEpoch = () => useAuthSessionStore.getState().epoch;

let dataOwnerId: string | null = null;

function clearUserData({ keepInvitation }: { keepInvitation: boolean }): void {
  useWorkspaceStore.getState().clearCalls();
  useSessionStore.getState().reset();
  usePrepStore.getState().reset();
  if (!keepInvitation) useInvitationStore.getState().clearToken();
  dataOwnerId = null;
}

function expireSession(): void {
  const signedIn = useAuthSessionStore.getState().user !== null;
  useAuthSessionStore.getState().expire();
  clearUserData({ keepInvitation: !signedIn });
}

export function startSession(session: SessionResponse): void {
  const previousUser = useAuthSessionStore.getState().user !== null || dataOwnerId !== null;
  clearUserData({ keepInvitation: !previousUser });
  useAuthSessionStore.getState().setSession(session);
}

const REFRESH_COOKIE_LOCK = 'seventh-vote:refresh-cookie';

function withRefreshCookie<T>(request: () => Promise<T>): Promise<T> {
  if (!('locks' in navigator)) return request();
  return navigator.locks.request(REFRESH_COOKIE_LOCK, request);
}

let refreshing: { epoch: number; promise: Promise<string> } | null = null;

function refreshAccessToken(): Promise<string> {
  const epoch = currentEpoch();
  if (refreshing?.epoch === epoch) return refreshing.promise;
  const previous = refreshing?.promise;
  const promise = (async () => {
    // Its outcome belongs to the older epoch; only its completion matters here.
    if (previous) await previous.catch(() => undefined);
    const session = await withRefreshCookie(() => refreshSession());
    if (currentEpoch() !== epoch) throw new StaleSessionError('Session changed during refresh');
    useAuthSessionStore.getState().rotateSession(session);
    return session.accessToken;
  })().finally(() => {
    if (refreshing?.promise === promise) refreshing = null;
  });
  refreshing = { epoch, promise };
  return promise;
}


export async function withAccessToken<T>(request: (accessToken: string) => Promise<T>): Promise<T> {
  const epoch = currentEpoch();
  const current = useAuthSessionStore.getState().accessToken;
  try {
    if (current !== null) {
      try {
        return await request(current);
      } catch (error) {
        if (!isSessionRejected(error)) throw error;
      }
    }
    return await request(await refreshAccessToken());
  } catch (error) {
    if (isSessionRejected(error) && currentEpoch() === epoch) expireSession();
    throw error;
  }
}

let restoring: { epoch: number; promise: Promise<void> } | null = null;


export function restoreSession(): Promise<void> {
  const epoch = currentEpoch();
  if (restoring?.epoch === epoch) return restoring.promise;
  const promise = (async () => {
    const store = useAuthSessionStore.getState();
    store.setStatus('loading');
    try {
      const user = await withAccessToken((token) => fetchCurrentUser(token));
      if (currentEpoch() !== epoch) return;
      if (dataOwnerId !== null && dataOwnerId !== user.id) clearUserData({ keepInvitation: false });
      dataOwnerId = user.id;
      store.setUser(user);
    } catch (error) {
      if (currentEpoch() !== epoch) return;
      if (isSessionRejected(error)) expireSession();
      else store.setStatus('error');
    }
  })().finally(() => {
    if (restoring?.promise === promise) restoring = null;
  });
  restoring = { epoch, promise };
  return promise;
}

export async function reloadCurrentUser(): Promise<void> {
  const epoch = currentEpoch();
  const user = await withAccessToken((token) => fetchCurrentUser(token));
  if (currentEpoch() === epoch) useAuthSessionStore.getState().setUser(user);
}

export async function changeWorkspace(workspaceId: string): Promise<void> {
  const epoch = currentEpoch();
  const session = await withAccessToken((token) =>
    withRefreshCookie(() => switchWorkspace(token, workspaceId)),
  );
  if (currentEpoch() !== epoch) return;
  useAuthSessionStore.getState().rotateSession(session);
  useWorkspaceStore.getState().clearCalls();
  await reloadCurrentUser();
}

export async function changeOwnPassword(request: ChangePasswordRequest): Promise<boolean> {
  useAuthSessionStore.getState().advanceEpoch();
  const epoch = currentEpoch();
  const session = await withAccessToken((token) =>
    withRefreshCookie(() => changePassword(token, request)),
  );
  if (currentEpoch() !== epoch) return false;
  useAuthSessionStore.getState().rotateSession(session);
  return true;
}

export async function signOut(): Promise<void> {
  useAuthSessionStore.getState().clear();
  useVerificationChallengeStore.getState().clearChallenge();
  clearUserData({ keepInvitation: false });
  await withRefreshCookie(() => logoutSession());
}
