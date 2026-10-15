import type { Request, RequestHandler, Response } from 'express';
import { accessClaims } from '../../shared/middleware/authenticate.js';
import type { UserService } from './user.service.js';

export interface UserController {
  me: RequestHandler;
}

export function createUserController(users: UserService): UserController {
  return {
    me: async (req: Request, res: Response) => {
      res.json(await users.getProfile(accessClaims(req)));
    },
  };
}
