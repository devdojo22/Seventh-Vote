import { create } from 'zustand';

interface InvitationState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useInvitationStore = create<InvitationState>()((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  clearToken: () => set({ token: null }),
}));
