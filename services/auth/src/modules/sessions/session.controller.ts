import type { Request, RequestHandler, Response } from 'express';
import { accessClaims } from '../../shared/middleware/authenticate.js';
import { requestContext } from '../../shared/http/request-context.js';
import { parseBody } from '../../shared/validation/parse-body.js';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from './session.cookie.js';
import type { IssuedSession, SessionService } from './session.service.js';
import { switchWorkspaceSchema } from './session.validation.js';

export interface SessionController {
  refresh: RequestHandler;
  logout: RequestHandler;
  switchWorkspace: RequestHandler;
}

export function createSessionController(sessions: SessionService, cookieSecure: boolean): SessionController {
  const respondWithSession = (res: Response, session: IssuedSession): void => {
    setRefreshCookie(res, session.refreshToken, session.refreshMaxAgeMs, cookieSecure);
    res.json(session.body);
  };

  return {
    refresh: async (req: Request, res: Response) => {
      respondWithSession(res, await sessions.refresh(readRefreshCookie(req), requestContext(req)));
    },

    logout: async (req: Request, res: Response) => {
      await sessions.logout(readRefreshCookie(req));
      clearRefreshCookie(res, cookieSecure);
      res.status(204).end();
    },

    switchWorkspace: async (req: Request, res: Response) => {
      const { sub } = accessClaims(req);
      const { workspaceId } = parseBody(switchWorkspaceSchema, req.body);
      respondWithSession(res, await sessions.switchWorkspace(sub, workspaceId, readRefreshCookie(req)));
    },
  };
}
