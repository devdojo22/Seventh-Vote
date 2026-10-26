import type { Request, RequestHandler, Response } from 'express';
import { accessClaims, authenticatedUser } from '../../shared/middleware/authenticate.js';
import type { UserService } from './user.service.js';

export interface UserController {
  me: RequestHandler;
  access: RequestHandler;
}

export function createUserController(users: UserService): UserController {
  return {
    me: async (req: Request, res: Response) => {
      res.json(await users.getProfile(authenticatedUser(req), accessClaims(req)));
    },
    access: async (req: Request, res: Response) => {
      res.json(await users.getAccess(authenticatedUser(req), accessClaims(req)));
    },
  };
}
