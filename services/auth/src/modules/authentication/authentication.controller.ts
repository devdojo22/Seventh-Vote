import type { Request, RequestHandler, Response } from 'express';
import { accessClaims, authenticatedUser, mfaClaims } from '../../shared/middleware/authenticate.js';
import { requestContext } from '../../shared/http/request-context.js';
import type { PasswordResetRequestedResponse, PasswordResetResponse } from '../../shared/types/api.types.js';
import { parseBody } from '../../shared/validation/parse-body.js';
import type { PasswordResetService } from '../password-reset/password-reset.service.js';
import { readRefreshCookie, sendSession } from '../sessions/session.cookie.js';
import type { AuthenticationService } from './authentication.service.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  mfaCodeSchema,
  resetPasswordSchema,
} from './authentication.validation.js';

const RESET_REQUESTED: PasswordResetRequestedResponse = {
  message: 'If an account exists for this email, you will receive password-reset instructions.',
};

export interface AuthenticationController {
  login: RequestHandler;
  verifyMfa: RequestHandler;
  resendMfaCode: RequestHandler;
  forgotPassword: RequestHandler;
  resetPassword: RequestHandler;
  changePassword: RequestHandler;
}

export function createAuthenticationController(
  authentication: AuthenticationService,
  passwordReset: PasswordResetService,
  cookieSecure: boolean,
): AuthenticationController {
  return {
    login: async (req: Request, res: Response) => {
      const input = parseBody(loginSchema, req.body);
      res.json(await authentication.login(input, requestContext(req)));
    },

    verifyMfa: async (req: Request, res: Response) => {
      const claims = mfaClaims(req);
      const { code } = parseBody(mfaCodeSchema, req.body);
      sendSession(res, await authentication.verifyCode(claims, code, requestContext(req)), cookieSecure);
    },

    resendMfaCode: async (req: Request, res: Response) => {
      res.json(await authentication.resendCode(mfaClaims(req), requestContext(req)));
    },

    forgotPassword: (req: Request, res: Response) => {
      const { email } = parseBody(forgotPasswordSchema, req.body);
      const context = requestContext(req);
      res.status(202).json(RESET_REQUESTED);
      passwordReset.requestReset(email, context).catch((error: unknown) => {
        context.log.error({ err: error }, 'password reset request failed');
      });
    },

    resetPassword: async (req: Request, res: Response) => {
      const { token, password } = parseBody(resetPasswordSchema, req.body);
      await passwordReset.resetPassword(token, password, requestContext(req));
      res.json({ passwordReset: true } satisfies PasswordResetResponse);
    },

    changePassword: async (req: Request, res: Response) => {
      const { currentPassword, newPassword } = parseBody(changePasswordSchema, req.body);
      const session = await passwordReset.changePassword(
        accessClaims(req),
        authenticatedUser(req),
        currentPassword,
        newPassword,
        readRefreshCookie(req),
        requestContext(req),
      );
      sendSession(res, session, cookieSecure);
    },
  };
}
