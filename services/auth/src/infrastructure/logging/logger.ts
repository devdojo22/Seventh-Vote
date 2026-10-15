import { pino, type Logger } from 'pino';
import type { LogLevel } from '../../config/environment.js';

/** Paths that can carry credentials. They are censored in every log line, including request logs. */
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.passwordHash',
  '*.mfaSecret',
  '*.tokenHash',
];

export function createLogger(level: LogLevel): Logger {
  return pino({
    level,
    base: { service: 'auth' },
    redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
  });
}
