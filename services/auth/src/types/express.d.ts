import type { User } from '@prisma/client';
import type { VerifiedTokenClaims } from '../modules/tokens/token.types.js';
import type { WorkspaceAccess } from '../modules/workspaces/workspace-access.service.js';

declare global {
  namespace Express {
    interface Request {
      auth?: VerifiedTokenClaims;
      authUser?: User;
      workspaceAccess?: WorkspaceAccess;
    }
  }
}

export {};
