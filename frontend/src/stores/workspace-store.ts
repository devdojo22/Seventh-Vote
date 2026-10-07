import { create } from 'zustand';
import type { MemberId } from '@/types/member';
import type { StanceLabel } from '@/types/simulation';

/**
 * PRIVACY CONSTRAINT (deliberate, do not weaken): "Your call" entries are the
 * user's private read of an elected official's stance. They live only in this
 * in-memory store: never persisted (no storage middleware), logged, sent, or
 * exported, and gone when the tab closes. Notes about officials' voting
 * intentions can face public-records exposure.
 */
interface WorkspaceState {
  calls: Partial<Record<MemberId, StanceLabel>>;
  /** Set the private read for one member, or clear it with null. */
  setCall: (memberId: MemberId, stance: StanceLabel | null) => void;
  clearCalls: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  calls: {},
  setCall: (memberId, stance) =>
    set((state) => {
      const calls = { ...state.calls };
      if (stance === null) delete calls[memberId];
      else calls[memberId] = stance;
      return { calls };
    }),
  clearCalls: () => set({ calls: {} }),
}));
