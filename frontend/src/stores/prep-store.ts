import { create } from 'zustand';
import { prepAgenda, type PrepBrief, type PrepValues } from '@/features/prep/prep-brief';
import { answerMemberId, runSimulation } from '@/features/simulation/simulation-api';
import {
  latestRequest,
  simulationErrorStatus,
  type SimulationErrorStatus,
} from '@/features/simulation/simulation-request';
import { ResponseContractError } from '@/lib/api/http';
import type { SessionInput } from '@/types/simulation';
import { useCouncilStore } from './council-store';

export type PrepStatus =
  { state: 'idle' } | { state: 'loading'; memberName: string } | SimulationErrorStatus;

const IDLE: PrepStatus = { state: 'idle' };

interface PrepState {
  values: PrepValues;
  sessionContext: SessionInput | null;
  brief: PrepBrief | null;
  status: PrepStatus;
  loadFromSession: (input: SessionInput) => void;
  build: (values: PrepValues) => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const simulations = latestRequest();

function initialPrep(): Pick<PrepState, 'values' | 'sessionContext' | 'brief' | 'status'> {
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
    status: IDLE,
  };
}

export const usePrepStore = create<PrepState>()((set, get) => ({
  ...initialPrep(),
  reset: () => {
    simulations.abort();
    set(initialPrep());
  },
  loadFromSession: (input) =>
    set((state) => ({
      sessionContext: input,
      values: { ...state.values, category: input.category, ask: input.ask, pitch: input.desc },
    })),
  build: async (values) => {
    const member = useCouncilStore.getState().membersById[values.memberId];
    if (!member) return;

    set({ values, status: { state: 'loading', memberName: member.name } });
    await simulations.run(
      async (signal) => {
        const run = await runSimulation(prepAgenda(values, get().sessionContext), [member.id], {
          signal,
        });
        const answer = run.answers.find((a) => answerMemberId(a) === member.id);
        if (!answer) throw new ResponseContractError('The run has no answer for this member');
        return answer;
      },
      {
        onDone: (answer) => {
          set({ brief: { member, answer }, status: IDLE });
        },
        onError: (error) => {
          set({ status: simulationErrorStatus(error) });
        },
      },
    );
  },
  retry: () => get().build(get().values),
  cancel: () => {
    simulations.abort();
    set({ status: IDLE });
  },
}));
