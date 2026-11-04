import { create } from 'zustand';
import {
  buildPrepBrief,
  prepInput,
  type PrepBrief,
  type PrepValues,
} from '@/lib/simulation/prep-brief';
import type { SessionInput } from '@/types/simulation';
import { useCouncilStore } from './council-store';

interface PrepState {
  values: PrepValues;
  sessionContext: SessionInput | null;
  brief: PrepBrief | null;
  loadFromSession: (input: SessionInput) => void;
  build: (values: PrepValues) => void;
  reset: () => void;
}

function initialPrep(): Pick<PrepState, 'values' | 'sessionContext' | 'brief'> {
  const { members, sessionDefaults } = useCouncilStore.getState();
  return {
    values: {
      memberId: members[0]?.id ?? '',
      category: sessionDefaults.category,
      ask: sessionDefaults.ask,
      pitch: sessionDefaults.desc,
    },
    sessionContext: null,
    brief: null,
  };
}

export const usePrepStore = create<PrepState>()((set, get) => ({
  ...initialPrep(),
  reset: () => set(initialPrep()),
  loadFromSession: (input) =>
    set((state) => ({
      sessionContext: input,
      values: { ...state.values, category: input.category, ask: input.ask, pitch: input.desc },
    })),
  build: (values) => {
    const member = useCouncilStore.getState().membersById[values.memberId];
    if (!member) return;
    const brief = buildPrepBrief(member, prepInput(values, get().sessionContext));
    set({ values, brief });
  },
}));
