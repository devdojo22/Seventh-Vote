import type { Request } from 'express';
import type { RequestContext } from '../../modules/audit/audit.service.js';

/** The client IP (resolved through the trusted proxy) and the request-scoped logger. */
export function requestContext(req: Request): RequestContext {
  return { ip: req.ip ?? null, log: req.log };
}
