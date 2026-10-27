import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { AppConfig } from './config/environment.js';
import type { Services } from './dependencies.js';
import { REQUEST_LOG_OPTIONS } from './infrastructure/logging/logger.js';
import { createAuthenticationController } from './modules/authentication/authentication.controller.js';
import { createAuthenticationRouter } from './modules/authentication/authentication.routes.js';
import { createInvitationController } from './modules/invitations/invitation.controller.js';
import { createInvitationRouter } from './modules/invitations/invitation.routes.js';
import { createSessionController } from './modules/sessions/session.controller.js';
import { createSessionRouter } from './modules/sessions/session.routes.js';
import { createUserController } from './modules/users/user.controller.js';
import { createUserRouter } from './modules/users/user.routes.js';
import { createWorkspaceController } from './modules/workspaces/workspace.controller.js';
import { createWorkspaceRouter } from './modules/workspaces/workspace.routes.js';
import { createAuthenticationGuards } from './shared/middleware/authenticate.js';
import { createAuthorizationGuards } from './shared/middleware/authorize.js';
import { errorHandler, notFoundHandler } from './shared/middleware/error-handler.js';
import { createRateLimiters } from './shared/middleware/rate-limit.js';

export interface AppDependencies {
  config: AppConfig;
  logger: Logger;
  services: Services;
  checkDatabase: () => Promise<void>;
}

export function createApp({ config, logger, services, checkDatabase }: AppDependencies): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(pinoHttp({ logger, ...REQUEST_LOG_OPTIONS }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/auth/health', async (req, res) => {
    try {
      await checkDatabase();
      res.json({ status: 'ok' });
    } catch (error) {
      req.log.warn({ err: error }, 'health check: database unreachable');
      res.status(503).json({ status: 'unavailable' });
    }
  });

  const guards = createAuthenticationGuards(services.tokens, services.users);
  const authorization = createAuthorizationGuards(services.workspaceAccess, services.audit);
  const limiters = createRateLimiters();
  app.use(
    '/auth',
    createAuthenticationRouter(
      createAuthenticationController(services.authentication, services.passwordReset, config.cookieSecure),
      guards,
      limiters,
    ),
    createSessionRouter(createSessionController(services.sessions, config.cookieSecure), guards),
    createUserRouter(createUserController(services.users), guards),
    createInvitationRouter(createInvitationController(services.invitations), guards, limiters),
    createWorkspaceRouter(createWorkspaceController(services.workspaces), guards, authorization, limiters),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
