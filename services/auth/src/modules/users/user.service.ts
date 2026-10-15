import { HttpError } from '../../shared/errors/http-error.js';
import type { MeResponse } from '../../shared/types/api.types.js';
import type { AccessTokenClaims } from '../tokens/token.types.js';
import type { UserRepository } from './user.repository.js';

export class UserService {
  constructor(private readonly users: UserRepository) {}

  /** The signed-in user and their workspaces. Only whitelisted, non-secret fields are returned. */
  async getProfile(claims: AccessTokenClaims): Promise<MeResponse> {
    const user = await this.users.findByIdWithWorkspaces(claims.sub);
    if (!user) throw new HttpError(401, 'Account not found');
    return {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      activeWorkspaceId: claims.wid,
      role: claims.role,
      workspaces: user.memberships.map((membership) => ({
        id: membership.workspace.id,
        name: membership.workspace.name,
        role: membership.role,
      })),
    };
  }
}
