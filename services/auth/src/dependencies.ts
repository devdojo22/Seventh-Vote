import type { PrismaClient } from '@prisma/client';
import type { AppConfig } from './config/environment.js';
import { checkDatabaseConnection } from './infrastructure/database/prisma.client.js';
import type { EmailSender } from './infrastructure/email/email-sender.js';
import { PrismaAuditRepository, type AuditRepository } from './modules/audit/audit.repository.js';
import { AuditService } from './modules/audit/audit.service.js';
import { AuthenticationService } from './modules/authentication/authentication.service.js';
import {
  PrismaLoginAttemptRepository,
  type LoginAttemptRepository,
} from './modules/authentication/login-attempt.repository.js';
import { PasswordHasher } from './modules/authentication/password-hasher.js';
import {
  PrismaInvitationRepository,
  type InvitationRepository,
} from './modules/invitations/invitation.repository.js';
import { InvitationService } from './modules/invitations/invitation.service.js';
import {
  PrismaEmailOtpChallengeRepository,
  type EmailOtpChallengeRepository,
} from './modules/mfa/email-otp.repository.js';
import { EmailOtpService } from './modules/mfa/email-otp.service.js';
import {
  PrismaPasswordResetRepository,
  type PasswordResetRepository,
} from './modules/password-reset/password-reset.repository.js';
import { PasswordResetService } from './modules/password-reset/password-reset.service.js';
import {
  PrismaRefreshTokenRepository,
  type RefreshTokenRepository,
} from './modules/sessions/refresh-token.repository.js';
import { SessionService } from './modules/sessions/session.service.js';
import { TokenService } from './modules/tokens/token.service.js';
import { PrismaUserRepository, type UserRepository } from './modules/users/user.repository.js';
import { UserService } from './modules/users/user.service.js';
import { PrismaMembershipRepository, type MembershipRepository } from './modules/workspaces/membership.repository.js';
import { WorkspaceAccessService } from './modules/workspaces/workspace-access.service.js';
import { PrismaWorkspaceRepository, type WorkspaceRepository } from './modules/workspaces/workspace.repository.js';
import { WorkspaceService } from './modules/workspaces/workspace.service.js';

export interface Repositories {
  users: UserRepository;
  workspaces: WorkspaceRepository;
  memberships: MembershipRepository;
  invitations: InvitationRepository;
  refreshTokens: RefreshTokenRepository;
  emailOtpChallenges: EmailOtpChallengeRepository;
  passwordResets: PasswordResetRepository;
  loginAttempts: LoginAttemptRepository;
  audit: AuditRepository;
}

export interface Services {
  authentication: AuthenticationService;
  passwordReset: PasswordResetService;
  sessions: SessionService;
  users: UserService;
  tokens: TokenService;
  audit: AuditService;
  workspaceAccess: WorkspaceAccessService;
  workspaces: WorkspaceService;
  invitations: InvitationService;
}

/** Builds every service from a set of repositories. */
export function createServices(config: AppConfig, repositories: Repositories, emailSender: EmailSender): Services {
  const now = () => new Date();
  const tokens = new TokenService(config.jwt);
  const audit = new AuditService(repositories.audit);
  const passwords = new PasswordHasher();
  const sessions = new SessionService({
    refreshTokens: repositories.refreshTokens,
    memberships: repositories.memberships,
    tokens,
    audit,
    policy: config.session,
    now,
  });
  const authentication = new AuthenticationService({
    users: repositories.users,
    passwords,
    tokens,
    otp: new EmailOtpService({
      challenges: repositories.emailOtpChallenges,
      email: emailSender,
      hmacKey: config.otpHmacKey,
      privacyStatementUrl: config.email.privacyStatementUrl,
      now,
    }),
    sessions,
    audit,
    loginAttempts: repositories.loginAttempts,
    now,
  });
  const passwordReset = new PasswordResetService({
    users: repositories.users,
    resets: repositories.passwordResets,
    loginAttempts: repositories.loginAttempts,
    passwords,
    sessions,
    email: emailSender,
    audit,
    appBaseUrl: config.appBaseUrl,
    privacyStatementUrl: config.email.privacyStatementUrl,
    now,
  });
  const invitations = new InvitationService({
    invitations: repositories.invitations,
    users: repositories.users,
    passwords,
    email: emailSender,
    audit,
    appBaseUrl: config.appBaseUrl,
    privacyStatementUrl: config.email.privacyStatementUrl,
    ttlMs: config.invitationTtlMs,
    now,
  });
  return {
    authentication,
    passwordReset,
    sessions,
    users: new UserService({ users: repositories.users, memberships: repositories.memberships }),
    tokens,
    audit,
    workspaceAccess: new WorkspaceAccessService({
      memberships: repositories.memberships,
      workspaces: repositories.workspaces,
    }),
    workspaces: new WorkspaceService({
      workspaces: repositories.workspaces,
      memberships: repositories.memberships,
      users: repositories.users,
      invitations,
      audit,
      now,
    }),
    invitations,
  };
}

export function createPrismaRepositories(prisma: PrismaClient): Repositories {
  return {
    users: new PrismaUserRepository(prisma),
    workspaces: new PrismaWorkspaceRepository(prisma),
    memberships: new PrismaMembershipRepository(prisma),
    invitations: new PrismaInvitationRepository(prisma),
    refreshTokens: new PrismaRefreshTokenRepository(prisma),
    emailOtpChallenges: new PrismaEmailOtpChallengeRepository(prisma),
    passwordResets: new PrismaPasswordResetRepository(prisma),
    loginAttempts: new PrismaLoginAttemptRepository(prisma),
    audit: new PrismaAuditRepository(prisma),
  };
}

export function createDatabaseHealthCheck(prisma: PrismaClient): () => Promise<void> {
  return () => checkDatabaseConnection(prisma);
}
