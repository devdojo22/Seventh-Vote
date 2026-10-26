import { pino, stdSerializers, type Logger } from 'pino';
import type { LogLevel } from '../../config/environment.js';


const SECRET_FIELDS = [
  'password',
  'confirmPassword',
  'currentPassword',
  'newPassword',
  'passwordHash',
  'codeHash',
  'token',
  'tokenHash',
  'mfaToken',
  'accessToken',
  'refreshToken',
  'apiKey',
  'authorization',
  'cookie',
  '["set-cookie"]',
];


const BODY_CONTAINERS = ['body', 'input'];

const MAX_DEPTH = 4;

function atEveryDepth(field: string): string[] {
  const separator = field.startsWith('[') ? '' : '.';
  return Array.from({ length: MAX_DEPTH + 1 }, (_, depth) =>
    depth === 0 ? field : `${Array<string>(depth).fill('*').join('.')}${separator}${field}`,
  );
}

const REDACTED_PATHS = [
  ...SECRET_FIELDS.flatMap(atEveryDepth),
  'code',
  ...BODY_CONTAINERS.flatMap((container) => atEveryDepth(`${container}.code`)),
  ...atEveryDepth('err.body'),
];

const errSerializer = stdSerializers.errWithCause;


export const REQUEST_LOG_OPTIONS = {
  wrapSerializers: false,
  serializers: { req: stdSerializers.req, res: stdSerializers.res, err: errSerializer },
};

export function createLogger(level: LogLevel): Logger {
  return pino({
    level,
    base: { service: 'auth' },
    serializers: { err: errSerializer },
    redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
  });
}
