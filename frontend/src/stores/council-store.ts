import { create } from 'zustand';
import { councilProfile, type CouncilProfile } from '@/lib/council-profile';
import type { CouncilConfig } from '@/types/council';
import type { Member, MemberId } from '@/types/member';
import type { ActionRule } from '@/types/simulation';

export type CouncilStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CouncilState extends Omit<CouncilProfile, 'config' | 'rules'> {
  workspaceId: string | null;
  status: CouncilStatus;
  error: string | null;
  stale: boolean;
  members: Member[];
  membersById: Record<MemberId, Member>;
  config: CouncilConfig;
  rules: ActionRule[];
  startLoading: (workspaceId: string) => void;
  setLoaded: (workspaceId: string, members: Member[], profile: CouncilProfile) => void;
  setFailed: (workspaceId: string, error: string) => void;
  markStale: () => void;
  clear: () => void;
}

const EMPTY = {
  ...councilProfile([], { name: '', voteRules: null }),
  members: [],
  membersById: {},
};


export const useCouncilStore = create<CouncilState>()((set) => ({
  ...EMPTY,
  workspaceId: null,
  status: 'idle',
  error: null,
  stale: false,
  startLoading: (workspaceId) =>
    set((state) =>
      state.workspaceId === workspaceId && state.status === 'ready'
        ? { stale: false }
        : { ...EMPTY, workspaceId, status: 'loading', error: null, stale: false },
    ),
  setLoaded: (workspaceId, members, profile) =>
    set((state) =>
      state.workspaceId === workspaceId
        ? {
            ...profile,
            members,
            membersById: Object.fromEntries(members.map((m) => [m.id, m])),
            status: 'ready',
            error: null,
          }
        : {},
    ),
 
  setFailed: (workspaceId, error) =>
    set((state) =>
      state.workspaceId !== workspaceId
        ? {}
        : state.status === 'ready'
          ? { error }
          : { status: 'error', error },
    ),
  markStale: () => set({ stale: true }),
  clear: () => set({ ...EMPTY, workspaceId: null, status: 'idle', error: null, stale: false }),
}));
