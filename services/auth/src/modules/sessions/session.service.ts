import { randomUUID } from 'node:crypto';
import type { SessionPolicy } from '../../config/environment.js';
import { HttpError } from '../../shared/errors/http-error.js';
import type { SessionResponse } from '../../shared/types/api.types.js';
import { randomToken, sha256 } from '../../shared/utils/hashing.js';
import type { AuditService, RequestContext } from '../audit/audit.service.js';
import type { TokenService } from '../tokens/token.service.js';
import type { MembershipRepository, MembershipScope } from '../workspaces/membership.repository.js';
import type { RefreshTokenRepository } from './refresh-token.repository.js';

export interface IssuedSession {
  body: SessionResponse;
  refreshToken: string;
  cookieMaxAgeMs: number | null;
}

export interface SessionServiceDependencies {
  refreshTokens: RefreshTokenRepository;
  memberships: MembershipRepository;
  tokens: TokenService;
  audit: AuditService;
  policy: SessionPolicy;
  now?: () => Date;
}


export class SessionService {
  private readonly now: () => Date;

  constructor(private readonly deps: SessionServiceDependencies) {
    this.now = deps.now ?? (() => new Date());
  }

  async issue(
    userId: string,
    membership: MembershipScope | null,
    persistent: boolean,
    securityVersion: number,
    sessionId: string = randomUUID(),
  ): Promise<IssuedSession> {
    const refreshToken = randomToken();
    const { persistentTtlMs, browserSessionTtlMs } = this.deps.policy;
    const lifetimeMs = persistent ? persistentTtlMs : browserSessionTtlMs;
    const workspaceId = membership?.workspaceId ?? null;
    const role = membership?.role ?? null;
    await this.deps.refreshTokens.create({
      userId,
      workspaceId,
      sessionId,
      tokenHash: sha256(refreshToken),
      persistent,
      expiresAt: new Date(this.now().getTime() + lifetimeMs),
      securityVersion,
    });
    const accessToken = this.deps.tokens.signAccessToken({ userId, workspaceId, role, securityVersion, sessionId });
    return {
      body: { accessToken, workspaceId, role },
      refreshToken,
      cookieMaxAgeMs: persistent ? persistentTtlMs : null,
    };
  }


  async issueInWorkspace(
    userId: string,
    workspaceId: string | null,
    persistent: boolean,
    securityVersion: number,
    sessionId?: string,
  ): Promise<IssuedSession> {
    const membership = workspaceId === null ? null : await this.deps.memberships.find(userId, workspaceId);
    return this.issue(userId, membership, persistent, securityVersion, sessionId);
  }

  /** Whether the sign-in an access token belongs to has not been ended (logout, removal, theft, expiry). */
  isSessionLive(sessionId: string, userId: string): Promise<boolean> {
    return this.deps.refreshTokens.isSessionLive(sessionId, userId, this.now());
  }


  async refresh(rawToken: string | undefined, context: RequestContext): Promise<IssuedSession> {
    if (rawToken === undefined) throw new HttpError(401, 'No session');
    const result = await this.deps.refreshTokens.consume(sha256(rawToken), this.now());
    switch (result.status) {
      case 'invalid':
        throw new HttpError(401, 'Session expired');
      case 'reused':
        await this.deps.audit.record(context, {
          action: 'auth.refresh_reuse',
          userId: result.userId,
          workspaceId: result.workspaceId,
        });
        throw new HttpError(401, 'Session revoked');
      case 'superseded':

        context.log.info({ userId: result.userId }, 'refresh lost a concurrent rotation of the same token');
        throw new HttpError(409, 'Session was refreshed by another request');
      case 'consumed':
        return this.issueInWorkspace(
          result.userId,
          result.workspaceId,
          result.persistent,
          result.securityVersion,
          result.sessionId,
        );
    }
  }

  async logout(rawToken: string | undefined, context: RequestContext): Promise<void> {
    if (rawToken === undefined) return;
    const revoked = await this.deps.refreshTokens.revoke(sha256(rawToken), this.now());
    if (revoked) {
      await this.deps.audit.record(context, {
        action: 'auth.logout',
        userId: revoked.userId,
        workspaceId: revoked.workspaceId,
      });
    }
  }

  async isLive(rawToken: string, userId: string): Promise<boolean> {
    return (await this.deps.refreshTokens.findPersistence(sha256(rawToken), userId, this.now())) !== null;
  }

  async switchWorkspace(
    userId: string,
    fromWorkspaceId: string | null,
    workspaceId: string,
    rawToken: string | undefined,
    context: RequestContext,
  ): Promise<IssuedSession> {
    if (rawToken === undefined) throw new HttpError(401, 'No session');
    const membership = await this.deps.memberships.find(userId, workspaceId);
    if (!membership) throw new HttpError(403, 'Not a member of that workspace');
    const revoked = await this.deps.refreshTokens.revokeForUser(sha256(rawToken), userId, this.now());
    if (!revoked) throw new HttpError(401, 'Session expired');
    const session = await this.issue(
      userId,
      membership,
      revoked.persistent,
      revoked.securityVersion,
      revoked.sessionId,
    );
    await this.deps.audit.record(context, {
      action: 'auth.workspace_switched',
      userId,
      workspaceId,
      meta: { fromWorkspaceId, toWorkspaceId: workspaceId },
    });
    return session;
  }
}
