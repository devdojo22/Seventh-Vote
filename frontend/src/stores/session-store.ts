import { create } from 'zustand';
import type { SessionInput } from '@/types/simulation';

interface SessionState {
  input: SessionInput | null;
  runId: number;
  run: (input: SessionInput) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  input: null,
  runId: 0,
  run: (input) => set((state) => ({ input, runId: state.runId + 1 })),
  reset: () => set({ input: null }),
}));
