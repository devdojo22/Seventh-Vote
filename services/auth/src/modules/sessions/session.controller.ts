import type { Request, RequestHandler, Response } from 'express';
import { accessClaims } from '../../shared/middleware/authenticate.js';
import { requestContext } from '../../shared/http/request-context.js';
import { parseBody } from '../../shared/validation/parse-body.js';
import { clearRefreshCookie, readRefreshCookie, sendSession } from './session.cookie.js';
import type { SessionService } from './session.service.js';
import { switchWorkspaceSchema } from './session.validation.js';

export interface SessionController {
  refresh: RequestHandler;
  logout: RequestHandler;
  switchWorkspace: RequestHandler;
}

export function createSessionController(sessions: SessionService, cookieSecure: boolean): SessionController {
  return {
    refresh: async (req: Request, res: Response) => {
      sendSession(res, await sessions.refresh(readRefreshCookie(req), requestContext(req)), cookieSecure);
    },

    logout: async (req: Request, res: Response) => {
      await sessions.logout(readRefreshCookie(req), requestContext(req));
      clearRefreshCookie(res, cookieSecure);
      res.status(204).end();
    },

    switchWorkspace: async (req: Request, res: Response) => {
      const { sub, wid } = accessClaims(req);
      const { workspaceId } = parseBody(switchWorkspaceSchema, req.body);
      const session = await sessions.switchWorkspace(
        sub,
        wid,
        workspaceId,
        readRefreshCookie(req),
        requestContext(req),
      );
      sendSession(res, session, cookieSecure);
    },
  };
}
