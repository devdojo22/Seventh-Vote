import { useEffect } from 'react';
import { describeDossierError } from '@/features/dossiers/dossier-errors';
import { useAppStore } from '@/stores/app-store';
import { useCurrentUser, useWorkspaceInSync } from '@/stores/auth-session-store';
import { useCouncilStore } from '@/stores/council-store';
import { usePrepStore } from '@/stores/prep-store';
import { useSessionStore } from '@/stores/session-store';
import { loadCouncil } from './council-members';

let latestRequest = 0;
// The workspace whose members prep was last reset for; null until a load for the current one succeeds.
let prepFor: string | null = null;

export function useCouncilLoader(): void {
  const user = useCurrentUser();
  const workspaceId = user.activeWorkspaceId;
  const canView = user.permissions?.viewDossiers ?? false;
  const inSync = useWorkspaceInSync();
  const loadedFor = useCouncilStore((s) => s.workspaceId);
  const stale = useCouncilStore((s) => s.stale);

  useEffect(() => {
    if (!inSync) return;
    const council = useCouncilStore.getState();
    if (!workspaceId || !canView) {
      if (council.workspaceId !== null) {
        council.clear();
        useSessionStore.getState().reset();
        usePrepStore.getState().reset();
        useAppStore.getState().closeMember();
        prepFor = null;
      }
      return;
    }
    const switching = council.workspaceId !== workspaceId;
    if (!switching && !stale) return;

    council.startLoading(workspaceId);
    if (switching) {
      useSessionStore.getState().reset();
      usePrepStore.getState().reset();
      useAppStore.getState().closeMember();
      prepFor = null;
    }
    const request = ++latestRequest;
    loadCouncil(workspaceId).then(
      ({ members, profile }) => {
        if (request !== latestRequest) return;
        useCouncilStore.getState().setLoaded(workspaceId, members, profile);
        if (prepFor !== workspaceId) {
          usePrepStore.getState().reset();
          prepFor = workspaceId;
        }
      },
      (error: unknown) => {
        if (request === latestRequest) {
          useCouncilStore.getState().setFailed(workspaceId, describeDossierError(error));
        }
      },
    );
  }, [workspaceId, canView, inSync, loadedFor, stale]);
}
