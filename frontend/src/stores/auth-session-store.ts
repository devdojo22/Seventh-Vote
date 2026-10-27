import { create } from 'zustand';
import type { CurrentUser } from '@/features/auth/auth-api';
import type { Role } from '@/types/access';


export type AuthStatus = 'unknown' | 'loading' | 'authenticated' | 'anonymous' | 'error';

interface SessionTokens {
  accessToken: string;
  workspaceId: string | null;
  role: Role | null;
}

interface AuthSessionState {
  status: AuthStatus;
  accessToken: string | null;
  workspaceId: string | null;
  role: Role | null;
  user: CurrentUser | null;
  sessionExpired: boolean;
  epoch: number;

  setSession: (session: SessionTokens) => void;
  rotateSession: (session: SessionTokens) => void;
  setUser: (user: CurrentUser) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
  expire: () => void;
  advanceEpoch: () => void;
}

export const useAuthSessionStore = create<AuthSessionState>()((set) => ({
  status: 'unknown',
  accessToken: null,
  workspaceId: null,
  role: null,
  user: null,
  sessionExpired: false,
  epoch: 0,
  setSession: ({ accessToken, workspaceId, role }) =>
    set((s) => ({
      accessToken,
      workspaceId,
      role,
      user: null,
      status: 'unknown',
      sessionExpired: false,
      epoch: s.epoch + 1,
    })),
  rotateSession: ({ accessToken, workspaceId, role }) => set({ accessToken, workspaceId, role }),
  setUser: (user) => set({ user, status: 'authenticated' }),
  setStatus: (status) => set({ status }),
  clear: () =>
    set((s) => ({
      accessToken: null,
      workspaceId: null,
      role: null,
      user: null,
      status: 'anonymous',
      epoch: s.epoch + 1,
    })),
  expire: () =>
    set((s) => ({
      accessToken: null,
      workspaceId: null,
      role: null,
      user: null,
      status: 'anonymous',
      sessionExpired: s.user !== null,
      epoch: s.epoch + 1,
    })),
  advanceEpoch: () => set((s) => ({ epoch: s.epoch + 1 })),
}));

export function useCurrentUser(): CurrentUser {
  const user = useAuthSessionStore((s) => s.user);
  if (!user) throw new Error('useCurrentUser must be used inside an authenticated route');
  return user;
}
