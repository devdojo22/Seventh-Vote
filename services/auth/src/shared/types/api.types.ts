import type { Role } from '@prisma/client';

/** Body of every non-2xx JSON response. */
export interface ErrorResponse {
  error: string;
  details?: unknown;
}

/** Returned by /register and /login: the password step passed, an MFA code is required next. */
export interface MfaChallengeResponse {
  mfaRequired: true;
  mfaSetupRequired: boolean;
  mfaToken: string;
}

export interface MfaSetupResponse {
  otpauthUrl: string;
  qrDataUrl: string;
}

/** Returned whenever a session is issued; the refresh token travels separately as an httpOnly cookie. */
export interface SessionResponse {
  accessToken: string;
  workspaceId: string | null;
  role: Role | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: Role;
}

export interface MeResponse {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  activeWorkspaceId: string | null;
  role: Role | null;
  workspaces: WorkspaceSummary[];
}
