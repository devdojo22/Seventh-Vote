import { create } from 'zustand';
import type { SessionInput } from '@/types/simulation';

interface SessionState {
  /** The most recently run session; results are derived from it. */
  input: SessionInput | null;
  runId: number;
  run: (input: SessionInput) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  input: null,
  runId: 0,
  run: (input) => set((state) => ({ input, runId: state.runId + 1 })),
}));
