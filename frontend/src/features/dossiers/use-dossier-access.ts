import { useCallback, useEffect, useState } from 'react';
import { listMembers } from '@/features/access/access-api';
import { useCurrentUser } from '@/stores/auth-session-store';

export interface DossierAccess {
  canView: boolean;
  canEdit: boolean;
}


export function useDossierAccess(): DossierAccess {
  const user = useCurrentUser();
  const active = user.activeWorkspaceId !== null;
  return {
    canView: active && user.permissions?.viewDossiers === true,
    canEdit: active && user.permissions?.editDossiers === true,
  };
}


export function useAuthorName(): (userId: string) => string {
  const user = useCurrentUser();
  const workspaceId = user.activeWorkspaceId;
  const canList = workspaceId !== null && user.permissions?.manageMembers === true;
  const [names, setNames] = useState<Readonly<Record<string, string>>>({});

  useEffect(() => {
    if (!canList) return;
    let active = true;
    listMembers(workspaceId).then(
      (members) => {
        if (active) {
          setNames(Object.fromEntries(members.map((m) => [m.userId, m.name ?? m.email])));
        }
      },
      () => {
      },
    );
    return () => {
      active = false;
    };
  }, [canList, workspaceId]);

  return useCallback(
    (userId: string) => (userId === user.id ? 'You' : (names[userId] ?? 'Workspace member')),
    [names, user.id],
  );
}
