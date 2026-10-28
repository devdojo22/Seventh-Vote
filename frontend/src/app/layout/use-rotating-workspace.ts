import { useEffect, useState } from 'react';
import type { WorkspaceAccess } from '@/features/auth/auth-api';

const ROTATE_MS = 3000;

/** Cycles through the user's workspace memberships, starting at the active one. */
export function useRotatingWorkspace(
  workspaces: WorkspaceAccess[],
  activeWorkspaceId: string | null,
  paused = false,
): WorkspaceAccess | undefined {
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      workspaces.findIndex((w) => w.id === activeWorkspaceId),
    ),
  );

  useEffect(() => {
    if (workspaces.length < 2 || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % workspaces.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [workspaces.length, paused]);

  return workspaces[index % workspaces.length];
}
