import { useCurrentUser } from '@/stores/auth-session-store';


export function useHasWorkspaceAccess(): boolean {
  const user = useCurrentUser();
  return user.isSuperAdmin || user.activeWorkspaceId !== null;
}
