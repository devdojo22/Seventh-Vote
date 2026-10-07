import { create } from 'zustand';
import { SESSION_DEFAULTS } from '@/data/session-defaults';
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
  /** Session loaded via "Use current session item"; later briefs share its settings. */
  sessionContext: SessionInput | null;
  brief: PrepBrief | null;
  loadFromSession: (input: SessionInput) => void;
  build: (values: PrepValues) => void;
}

export const usePrepStore = create<PrepState>()((set, get) => ({
  values: {
    memberId: useCouncilStore.getState().members[0]?.id ?? '',
    category: SESSION_DEFAULTS.category,
    ask: SESSION_DEFAULTS.ask,
    pitch: SESSION_DEFAULTS.desc,
  },
  sessionContext: null,
  brief: null,
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
