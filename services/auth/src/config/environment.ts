import { z } from 'zod';

/** Duration accepted for token lifetimes: a positive integer with a unit, e.g. "900s", "15m", "12h", "7d". */
const DURATION_PATTERN = /^(\d+)(s|m|h|d)$/;
const SECONDS_PER_UNIT = { s: 1, m: 60, h: 3600, d: 86_400 } as const;

function durationToSeconds(value: string, ctx: z.RefinementCtx): number {
  const match = DURATION_PATTERN.exec(value.trim());
  const amount = match?.[1];
  const unit = match?.[2];
  if (amount === undefined || (unit !== 's' && unit !== 'm' && unit !== 'h' && unit !== 'd')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Use a whole number followed by s, m, h or d (e.g. "15m")' });
    return z.NEVER;
  }
  const seconds = Number(amount) * SECONDS_PER_UNIT[unit];
  if (seconds <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duration must be greater than zero' });
    return z.NEVER;
  }
  return seconds;
}

/** docker compose passes blank `KEY=` lines through as empty strings; treat them as unset. */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema);

const booleanFlag = optional(
  z
    .enum(['true', 'false', 'TRUE', 'FALSE', 'True', 'False'])
    .default('false')
    .transform((value) => value.toLowerCase() === 'true'),
);

const environmentSchema = z.object({
  NODE_ENV: optional(z.enum(['development', 'production', 'test']).default('development')),
  LOG_LEVEL: optional(z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info')),
  AUTH_PORT: optional(z.coerce.number().int().min(1).max(65_535).default(4000)),
  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ISSUER: optional(z.string().min(1).default('seventh-vote-auth')),
  JWT_AUDIENCE: optional(z.string().min(1).default('seventh-vote')),
  ACCESS_TOKEN_TTL: optional(z.string().default('15m')).transform(durationToSeconds),
  REFRESH_TOKEN_TTL_DAYS: optional(z.coerce.number().int().min(1).max(365).default(7)),

  MFA_ENCRYPTION_KEY: z.string().min(32, 'MFA_ENCRYPTION_KEY must be at least 32 characters'),
  MFA_ISSUER: optional(z.string().min(1).default('Seventh Vote')),

  COOKIE_SECURE: booleanFlag,
  ALLOW_SELF_REGISTER: booleanFlag,
});

export type NodeEnvironment = 'development' | 'production' | 'test';
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export interface JwtConfig {
  readonly secret: string;
  readonly issuer: string;
  readonly audience: string;
  readonly accessTokenTtlSeconds: number;
  /** Lifetime of the token proving the password step passed; only /mfa/* accepts it. */
  readonly mfaTokenTtlSeconds: number;
}

export interface AppConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly logLevel: LogLevel;
  readonly port: number;
  readonly databaseUrl: string;
  readonly jwt: JwtConfig;
  readonly refreshTokenTtlDays: number;
  readonly mfa: { readonly encryptionKey: string; readonly issuer: string };
  readonly cookieSecure: boolean;
  readonly allowSelfRegister: boolean;
}

export class ConfigurationError extends Error {
  override readonly name = 'ConfigurationError';

  constructor(readonly issues: readonly string[]) {
    super(`Invalid environment configuration:\n  - ${issues.join('\n  - ')}`);
  }
}

const MFA_TOKEN_TTL_SECONDS = 5 * 60;

/** Validates the process environment once at startup. Throws ConfigurationError listing every problem. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigurationError(
      parsed.error.issues.map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`),
    );
  }
  const e = parsed.data;
  return Object.freeze({
    nodeEnv: e.NODE_ENV,
    logLevel: e.LOG_LEVEL,
    port: e.AUTH_PORT,
    databaseUrl: e.DATABASE_URL,
    jwt: Object.freeze({
      secret: e.JWT_SECRET,
      issuer: e.JWT_ISSUER,
      audience: e.JWT_AUDIENCE,
      accessTokenTtlSeconds: e.ACCESS_TOKEN_TTL,
      mfaTokenTtlSeconds: MFA_TOKEN_TTL_SECONDS,
    }),
    refreshTokenTtlDays: e.REFRESH_TOKEN_TTL_DAYS,
    mfa: Object.freeze({ encryptionKey: e.MFA_ENCRYPTION_KEY, issuer: e.MFA_ISSUER }),
    cookieSecure: e.COOKIE_SECURE,
    allowSelfRegister: e.ALLOW_SELF_REGISTER,
  });
}
