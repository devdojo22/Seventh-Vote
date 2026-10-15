import type { PrismaClient } from '@prisma/client';
import type { AppConfig } from './config/environment.js';
import { checkDatabaseConnection } from './infrastructure/database/prisma.client.js';
import { PrismaAuditRepository, type AuditRepository } from './modules/audit/audit.repository.js';
import { AuditService } from './modules/audit/audit.service.js';
import { AuthenticationService } from './modules/authentication/authentication.service.js';
import { PasswordHasher } from './modules/authentication/password-hasher.js';
import { MfaSecretCipher } from './modules/mfa/mfa-secret.cipher.js';
import { MfaService } from './modules/mfa/mfa.service.js';
import {
  PrismaRefreshTokenRepository,
  type RefreshTokenRepository,
} from './modules/sessions/refresh-token.repository.js';
import { SessionService } from './modules/sessions/session.service.js';
import { TokenService } from './modules/tokens/token.service.js';
import { PrismaUserRepository, type UserRepository } from './modules/users/user.repository.js';
import { UserService } from './modules/users/user.service.js';
import { PrismaMembershipRepository, type MembershipRepository } from './modules/workspaces/membership.repository.js';

export interface Repositories {
  users: UserRepository;
  memberships: MembershipRepository;
  refreshTokens: RefreshTokenRepository;
  audit: AuditRepository;
}

export interface Services {
  authentication: AuthenticationService;
  sessions: SessionService;
  users: UserService;
  tokens: TokenService;
}

export interface ServiceOptions {
  /** bcrypt cost; defaults to the production value. */
  bcryptCost?: number;
  /** Clock in epoch milliseconds; injectable so tests can pin TOTP time steps. */
  now?: () => number;
}

/** Builds every service from a set of repositories. Shared by the server and the test suite. */
export function createServices(config: AppConfig, repositories: Repositories, options: ServiceOptions = {}): Services {
  const now = options.now ?? Date.now;
  const tokens = new TokenService(config.jwt);
  const audit = new AuditService(repositories.audit);
  const sessions = new SessionService({
    refreshTokens: repositories.refreshTokens,
    memberships: repositories.memberships,
    tokens,
    audit,
    refreshTokenTtlDays: config.refreshTokenTtlDays,
    now: () => new Date(now()),
  });
  const authentication = new AuthenticationService({
    users: repositories.users,
    passwords: new PasswordHasher(options.bcryptCost),
    tokens,
    mfa: new MfaService(config.mfa.issuer, now),
    mfaCipher: new MfaSecretCipher(config.mfa.encryptionKey),
    sessions,
    audit,
    allowSelfRegister: config.allowSelfRegister,
  });
  return { authentication, sessions, users: new UserService(repositories.users), tokens };
}

export function createPrismaRepositories(prisma: PrismaClient): Repositories {
  return {
    users: new PrismaUserRepository(prisma),
    memberships: new PrismaMembershipRepository(prisma),
    refreshTokens: new PrismaRefreshTokenRepository(prisma),
    audit: new PrismaAuditRepository(prisma),
  };
}

export function createDatabaseHealthCheck(prisma: PrismaClient): () => Promise<void> {
  return () => checkDatabaseConnection(prisma);
}
