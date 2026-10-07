import { create } from 'zustand';
import { councilConfig } from '@/data/council';
import { members } from '@/data/members';
import { ACTION_RULES } from '@/data/voting-rules';
import type { CouncilConfig } from '@/types/council';
import type { Member, MemberId } from '@/types/member';
import type { ActionRule } from '@/types/simulation';

interface CouncilState {
  members: Member[];
  membersById: Record<MemberId, Member>;
  config: CouncilConfig;
  rules: ActionRule[];
}

/** Read-only council data. Swap this initializer for a fetch when a backend exists. */
export const useCouncilStore = create<CouncilState>()(() => ({
  members,
  membersById: Object.fromEntries(members.map((m) => [m.id, m])),
  config: councilConfig,
  rules: ACTION_RULES,
}));
