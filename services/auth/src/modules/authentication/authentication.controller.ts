import type { Request, RequestHandler, Response } from 'express';
import { mfaClaims } from '../../shared/middleware/authenticate.js';
import { requestContext } from '../../shared/http/request-context.js';
import { parseBody } from '../../shared/validation/parse-body.js';
import { setRefreshCookie } from '../sessions/session.cookie.js';
import type { AuthenticationService } from './authentication.service.js';
import { loginSchema, mfaCodeSchema, registerSchema } from './authentication.validation.js';

export interface AuthenticationController {
  register: RequestHandler;
  login: RequestHandler;
  startMfaSetup: RequestHandler;
  verifyMfa: RequestHandler;
}

export function createAuthenticationController(
  authentication: AuthenticationService,
  cookieSecure: boolean,
): AuthenticationController {
  return {
    register: async (req: Request, res: Response) => {
      const input = parseBody(registerSchema, req.body);
      res.status(201).json(await authentication.register(input, requestContext(req)));
    },

    login: async (req: Request, res: Response) => {
      const input = parseBody(loginSchema, req.body);
      res.json(await authentication.login(input, requestContext(req)));
    },

    startMfaSetup: async (req: Request, res: Response) => {
      res.json(await authentication.startMfaSetup(mfaClaims(req).sub));
    },

    verifyMfa: async (req: Request, res: Response) => {
      const { sub } = mfaClaims(req);
      const { code } = parseBody(mfaCodeSchema, req.body);
      const session = await authentication.verifyMfa(sub, code, requestContext(req));
      setRefreshCookie(res, session.refreshToken, session.refreshMaxAgeMs, cookieSecure);
      res.json(session.body);
    },
  };
}
