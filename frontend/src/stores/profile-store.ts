import { create } from 'zustand';
import { SAMPLE_USERS } from '@/data/access-sample';
import type { AccessUser } from '@/types/access';

export type ProfileInput = Pick<AccessUser, 'name' | 'email'>;

/**
 * The "signed-in" user shown on My Profile. There is no session yet (auth arrives with M2),
 * so this is a demonstration copy of the first Access Control sample user, held in memory
 * only: edits last until the tab reloads and never leave the browser.
 */
const DEMO_PROFILE: AccessUser = SAMPLE_USERS[0] ?? {
  id: 'demo',
  name: 'Demo User',
  email: 'demo@example.gov',
  mfaEnabled: false,
  isSuperAdmin: false,
  createdAt: '2026-01-01',
  memberships: [],
};

interface ProfileState {
  user: AccessUser;
  /** True while the profile is demonstration data rather than an authenticated account. */
  isDemo: boolean;
  updateProfile: (input: ProfileInput) => void;
}

export const useProfileStore = create<ProfileState>()((set) => ({
  user: DEMO_PROFILE,
  isDemo: true,
  updateProfile: (input) => set((s) => ({ user: { ...s.user, ...input } })),
}));
