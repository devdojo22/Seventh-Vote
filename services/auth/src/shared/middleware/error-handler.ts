import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../errors/http-error.js';
import type { ErrorResponse } from '../types/api.types.js';

/** body-parser marks its own failures with a `type` string. */
function bodyParserErrorType(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'type' in error && typeof error.type === 'string') {
    return error.type;
  }
  return undefined;
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' } satisfies ErrorResponse);
};

/**
 * Single place that turns errors into responses. Only HttpError messages reach the
 * client; anything unexpected is logged and reported as a generic 500.
 */
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof HttpError) {
    const body: ErrorResponse = { error: error.message, code: error.code, details: error.details };
    res.status(error.status).json(body);
    return;
  }
  const parserError = bodyParserErrorType(error);
  if (parserError === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON body' } satisfies ErrorResponse);
    return;
  }
  if (parserError === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large' } satisfies ErrorResponse);
    return;
  }
  req.log.error({ err: error }, 'unhandled error');
  res.status(500).json({ error: 'Internal server error' } satisfies ErrorResponse);
};
