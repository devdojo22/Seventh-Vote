import { create } from 'zustand';

export interface VerificationChallenge {
  mfaToken: string;
  email: string;
  resendAvailableAt: number;
}

interface ChallengeInput {
  mfaToken: string;
  email: string;
  resendAfterSeconds: number;
}


interface VerificationChallengeState {
  challenge: VerificationChallenge | null;
  setChallenge: (input: ChallengeInput) => void;
  delayResend: (seconds: number) => void;
  clearChallenge: () => void;
}

export const useVerificationChallengeStore = create<VerificationChallengeState>()((set) => ({
  challenge: null,
  setChallenge: ({ mfaToken, email, resendAfterSeconds }) =>
    set({
      challenge: {
        mfaToken,
        email,
        resendAvailableAt: Date.now() + resendAfterSeconds * 1000,
      },
    }),
  delayResend: (seconds) =>
    set(({ challenge }) => ({
      challenge: challenge && { ...challenge, resendAvailableAt: Date.now() + seconds * 1000 },
    })),
  clearChallenge: () => set({ challenge: null }),
}));
