import { create } from 'zustand';
import { SAMPLE_USERS, SAMPLE_WORKSPACES } from '@/data/access-sample';
import type { AccessUser, UserInput, Workspace } from '@/types/access';

export type UserEditor = { mode: 'add' } | { mode: 'edit'; userId: string };

interface AccessState {
  workspaces: Workspace[];
  users: AccessUser[];
  openUserId: string | null;
  editor: UserEditor | null;
  openUser: (id: string) => void;
  closeUser: () => void;
  openEditor: (editor: UserEditor) => void;
  closeEditor: () => void;
  saveUser: (input: UserInput, userId?: string) => void;
}

export const useAccessStore = create<AccessState>()((set) => ({
  workspaces: SAMPLE_WORKSPACES,
  users: SAMPLE_USERS,
  openUserId: null,
  editor: null,
  openUser: (id) => set({ openUserId: id }),
  closeUser: () => set({ openUserId: null }),
  openEditor: (editor) => set({ editor, openUserId: null }),
  closeEditor: () => set({ editor: null }),
  saveUser: (input, userId) =>
    set((s) => ({
      editor: null,
      users: userId
        ? s.users.map((u) => (u.id === userId ? { ...u, ...input } : u))
        : [
            {
              ...input,
              id: crypto.randomUUID(),
              mfaEnabled: false,
              isSuperAdmin: false,
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...s.users,
          ],
    })),
}));
