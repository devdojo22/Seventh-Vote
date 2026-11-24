import { create } from 'zustand';
import { sessionAgenda } from '@/features/session/session-agenda';
import {
  answerMemberId,
  runSimulation,
  type MemberSlugs,
  type SimulationAnswer,
} from '@/features/simulation/simulation-api';
import {
  latestRequest,
  simulationErrorStatus,
  type SimulationErrorStatus,
} from '@/features/simulation/simulation-request';
import { ResponseContractError } from '@/lib/api/http';
import { presentMemberIds } from '@/lib/simulation/member-rows';
import { ruleOrOrdinary } from '@/lib/simulation/thresholds';
import type { Member } from '@/types/member';
import type { ActionRule, SessionInput, VoteProcedure } from '@/types/simulation';
import { useCouncilStore } from './council-store';

export type SessionStatus =
  { state: 'idle' } | { state: 'loading'; memberCount: number } | SimulationErrorStatus;
export interface SessionResult {
  input: SessionInput;
  members: Member[];
  answers: SimulationAnswer[];
  rule: ActionRule;
  seatCount: number;
  procedure: VoteProcedure;
}

const IDLE: SessionStatus = { state: 'idle' };

interface SessionState {
  input: SessionInput | null;
  result: SessionResult | null;
  completedRuns: number;
  status: SessionStatus;
  run: (input: SessionInput) => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const simulations = latestRequest();

export const useSessionStore = create<SessionState>()((set, get) => ({
  input: null,
  result: null,
  completedRuns: 0,
  status: IDLE,
  run: async (input) => {
    const { members, rules, procedure, config } = useCouncilStore.getState();
    const rule = ruleOrOrdinary(rules, input.actionType);
    const ruledBy = { rule, seatCount: config.seatCount, procedure };
    const [first, ...rest] = presentMemberIds(members, input.attendance);

    simulations.abort();
    set({ input });
    if (first === undefined) {
      set((s) => ({
        result: { input, members, answers: [], ...ruledBy },
        status: IDLE,
        completedRuns: s.completedRuns + 1,
      }));
      return;
    }

    const ids: MemberSlugs = [first, ...rest];
    set({ status: { state: 'loading', memberCount: ids.length } });
    await simulations.run(
      async (signal) => {
        const run = await runSimulation(sessionAgenda(input, rule), ids, { signal });
        const answered = new Set(run.answers.map(answerMemberId));
        if (!ids.every((id) => answered.has(id))) {
          throw new ResponseContractError('The run is missing an answer for a present member');
        }
        return run.answers;
      },
      {
        onDone: (answers) => {
          set((s) => ({
            result: { input, members, answers, ...ruledBy },
            status: IDLE,
            completedRuns: s.completedRuns + 1,
          }));
        },
        onError: (error) => {
          set({ status: simulationErrorStatus(error) });
        },
      },
    );
  },
  retry: async () => {
    const { input } = get();
    if (input) await get().run(input);
  },
  cancel: () => {
    simulations.abort();
    set({ status: IDLE });
  },
  reset: () => {
    simulations.abort();
    set({ input: null, result: null, status: IDLE });
  },
}));
