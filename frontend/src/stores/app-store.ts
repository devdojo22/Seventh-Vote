import { create } from 'zustand';
import type { MemberId } from '@/types/member';

const TOAST_DURATION_MS = 1800;

let toastTimer: number | undefined;

interface AppState {
  toast: string | null;
  openMemberId: MemberId | null;
  showToast: (message: string) => void;
  openMember: (id: MemberId) => void;
  closeMember: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  toast: null,
  openMemberId: null,
  showToast: (message) => {
    window.clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = window.setTimeout(() => set({ toast: null }), TOAST_DURATION_MS);
  },
  openMember: (id) => set({ openMemberId: id }),
  closeMember: () => set({ openMemberId: null }),
}));
