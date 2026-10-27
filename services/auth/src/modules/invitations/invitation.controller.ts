import type { Request, RequestHandler, Response } from 'express';
import { requestContext } from '../../shared/http/request-context.js';
import { authenticatedUser } from '../../shared/middleware/authenticate.js';
import { parseBody } from '../../shared/validation/parse-body.js';
import type { InvitationService } from './invitation.service.js';
import { acceptInvitationSchema, invitationTokenBodySchema } from './invitation.validation.js';

export interface InvitationController {
  preview: RequestHandler;
  accept: RequestHandler;
  join: RequestHandler;
}

export function createInvitationController(invitations: InvitationService): InvitationController {
  return {
    preview: async (req: Request, res: Response) => {
      const { token } = parseBody(invitationTokenBodySchema, req.body);
      res.json(await invitations.preview(token));
    },

    accept: async (req: Request, res: Response) => {
      const input = parseBody(acceptInvitationSchema, req.body);
      res.status(201).json(await invitations.acceptWithNewAccount(input, requestContext(req)));
    },

    join: async (req: Request, res: Response) => {
      const { token } = parseBody(invitationTokenBodySchema, req.body);
      res.json(await invitations.join(authenticatedUser(req), token, requestContext(req)));
    },
  };
}
