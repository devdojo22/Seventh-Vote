import { HttpError } from '../../shared/errors/http-error.js';
import type { SessionResponse } from '../../shared/types/api.types.js';
import { randomToken, sha256 } from '../../shared/utils/hashing.js';
import type { AuditService, RequestContext } from '../audit/audit.service.js';
import type { TokenService } from '../tokens/token.service.js';
import type { MembershipRepository, MembershipScope } from '../workspaces/membership.repository.js';
import type { RefreshTokenRepository } from './refresh-token.repository.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** A freshly issued session: the JSON body plus the refresh token the controller puts in a cookie. */
export interface IssuedSession {
  body: SessionResponse;
  refreshToken: string;
  refreshMaxAgeMs: number;
}

export interface SessionServiceDependencies {
  refreshTokens: RefreshTokenRepository;
  memberships: MembershipRepository;
  tokens: TokenService;
  audit: AuditService;
  refreshTokenTtlDays: number;
  now?: () => Date;
}

/** Owns the refresh-token lifecycle: issue, rotate, detect reuse, revoke. */
export class SessionService {
  private readonly now: () => Date;

  constructor(private readonly deps: SessionServiceDependencies) {
    this.now = deps.now ?? (() => new Date());
  }

  /** Stores a new hashed refresh token and signs an access token scoped to `membership` (if any). */
  async issue(userId: string, membership: MembershipScope | null): Promise<IssuedSession> {
    const refreshToken = randomToken();
    const refreshMaxAgeMs = this.deps.refreshTokenTtlDays * MS_PER_DAY;
    const workspaceId = membership?.workspaceId ?? null;
    const role = membership?.role ?? null;
    await this.deps.refreshTokens.create({
      userId,
      workspaceId,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(this.now().getTime() + refreshMaxAgeMs),
    });
    return {
      body: { accessToken: this.deps.tokens.signAccessToken({ userId, workspaceId, role }), workspaceId, role },
      refreshToken,
      refreshMaxAgeMs,
    };
  }

  /** Rotates a refresh token. Presenting an already-used token revokes every session of that user. */
  async refresh(rawToken: string | undefined, context: RequestContext): Promise<IssuedSession> {
    if (rawToken === undefined) throw new HttpError(401, 'No session');
    const result = await this.deps.refreshTokens.consume(sha256(rawToken), this.now());
    switch (result.status) {
      case 'invalid':
        throw new HttpError(401, 'Session expired');
      case 'reused':
        this.deps.audit.record(context, { action: 'auth.refresh_reuse', userId: result.userId });
        throw new HttpError(401, 'Session revoked');
      case 'consumed': {
        // Re-read the membership so a removed member loses the workspace scope on next refresh.
        const membership =
          result.workspaceId === null ? null : await this.deps.memberships.find(result.userId, result.workspaceId);
        return this.issue(result.userId, membership);
      }
    }
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (rawToken !== undefined) await this.deps.refreshTokens.revoke(sha256(rawToken), this.now());
  }

  /** Re-issues the session scoped to another workspace the user belongs to. */
  async switchWorkspace(userId: string, workspaceId: string, rawToken: string | undefined): Promise<IssuedSession> {
    const membership = await this.deps.memberships.find(userId, workspaceId);
    if (!membership) throw new HttpError(403, 'Not a member of that workspace');
    if (rawToken !== undefined) {
      await this.deps.refreshTokens.revokeForUser(sha256(rawToken), userId, this.now());
    }
    return this.issue(userId, membership);
  }
}
