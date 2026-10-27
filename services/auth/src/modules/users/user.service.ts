import type { Membership, User } from '@prisma/client';
import { HttpError } from '../../shared/errors/http-error.js';
import type { AccessResponse, MeResponse } from '../../shared/types/api.types.js';
import type { AccessTokenClaims } from '../tokens/token.types.js';
import type { MembershipRepository } from '../workspaces/membership.repository.js';
import { permissionsFor } from '../workspaces/workspace-permissions.js';
import type { UserRepository } from './user.repository.js';

export function displayName(user: Pick<User, 'firstName' | 'lastName' | 'name'>): string | null {
  const parts = [user.firstName, user.lastName].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' ') : user.name;
}

function accessIn(user: User, active: Membership | null): AccessResponse {
  return {
    id: user.id,
    isSuperAdmin: user.isSuperAdmin,
    activeWorkspaceId: active?.workspaceId ?? null,
    role: active?.role ?? null,
    permissions:
      active === null
        ? null
        : permissionsFor(
            user.isSuperAdmin
              ? { kind: 'platform-operator' }
              : { kind: 'member', role: active.role, canEditDossiers: active.canEditDossiers },
          ),
  };
}

export interface UserServiceDependencies {
  users: UserRepository;
  memberships: MembershipRepository;
}

export class UserService {
  constructor(private readonly deps: UserServiceDependencies) {}

  async assertTokenCurrent(claims: AccessTokenClaims): Promise<User> {
    const user = await this.deps.users.findById(claims.sub);
    if (!user) throw new HttpError(401, 'Account not found');
    if (claims.sv !== user.securityVersion) throw new HttpError(401, 'Invalid or expired token');
    return user;
  }

  async getAccess(user: User, claims: AccessTokenClaims): Promise<AccessResponse> {
    const active = claims.wid === null ? null : await this.deps.memberships.find(user.id, claims.wid);
    return accessIn(user, active);
  }

  async getProfile(user: User, claims: AccessTokenClaims): Promise<MeResponse> {
    const memberships = await this.deps.memberships.listForUser(user.id);
    const active = memberships.find((membership) => membership.workspaceId === claims.wid) ?? null;
    return {
      ...accessIn(user, active),
      email: user.email,
      name: displayName(user),
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      canEditDossiers: active?.canEditDossiers ?? false,
      workspaces: memberships.map((membership) => ({
        id: membership.workspace.id,
        name: membership.workspace.name,
        role: membership.role,
      })),
    };
  }
}
