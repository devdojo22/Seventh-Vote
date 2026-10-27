import { z } from 'zod';

/** Duration accepted for token lifetimes: a positive integer with a unit, e.g. "900s", "15m", "12h", "7d". */
const DURATION_PATTERN = /^(\d+)(s|m|h|d)$/;
const SECONDS_PER_UNIT = { s: 1, m: 60, h: 3600, d: 86_400 } as const;

function durationToSeconds(value: string, ctx: z.RefinementCtx): number {
  const match = DURATION_PATTERN.exec(value.trim());
  const amount = match?.[1];
  const unit = match?.[2];
  if (amount === undefined || (unit !== 's' && unit !== 'm' && unit !== 'h' && unit !== 'd')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use a whole number followed by s, m, h or d (e.g. "15m")',
    });
    return z.NEVER;
  }
  const seconds = Number(amount) * SECONDS_PER_UNIT[unit];
  if (seconds <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Duration must be greater than zero',
    });
    return z.NEVER;
  }
  return seconds;
}

/** Access tokens cannot be revoked one by one, so their lifetime is capped. */
const MAX_ACCESS_TOKEN_TTL_SECONDS = 3600;

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** docker compose passes blank `KEY=` lines through as empty strings; treat them as unset. */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema);

const booleanFlag = optional(
  z
    .enum(['true', 'false', 'TRUE', 'FALSE', 'True', 'False'])
    .default('false')
    .transform((value) => value.toLowerCase() === 'true'),
);

const environmentSchema = z
  .object({
    NODE_ENV: optional(z.enum(['development', 'production', 'test']).default('development')),
    LOG_LEVEL: optional(z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info')),
    AUTH_PORT: optional(z.coerce.number().int().min(1).max(65_535).default(4000)),
    DATABASE_URL: z.string().url(),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_ISSUER: optional(z.string().min(1).default('seventh-vote-auth')),
    JWT_AUDIENCE: optional(z.string().min(1).default('seventh-vote')),
    ACCESS_TOKEN_TTL: optional(z.string().default('15m'))
      .transform(durationToSeconds)
      .refine((seconds) => seconds <= MAX_ACCESS_TOKEN_TTL_SECONDS, 'ACCESS_TOKEN_TTL must be at most 1h'),
    /** "Keep me signed in" checked: persistent cookie, session ends after this many days without use. */
    REFRESH_TOKEN_TTL_DAYS: optional(z.coerce.number().int().min(1).max(365).default(7)),
    /** Unchecked: browser-session cookie, and the server also ends the session after this many hours without use. */
    BROWSER_SESSION_TTL_HOURS: optional(z.coerce.number().int().min(1).max(168).default(12)),

    OTP_HMAC_KEY: z.string().min(32, 'OTP_HMAC_KEY must be at least 32 characters'),

    NYLAS_API_KEY: z.string().trim().min(1, 'NYLAS_API_KEY is required to send verification codes'),
    /** Regional API host of the Nylas application, e.g. https://api.us.nylas.com. */
    NYLAS_API_URI: z
      .string()
      .trim()
      .url()
      .transform((value) => value.replace(/\/+$/, '')),
    /** Domain verified for Transactional Send, e.g. your-app.nylas.email or mail.example.gov. */
    NYLAS_SEND_DOMAIN: z.string().trim().toLowerCase().min(1),
    EMAIL_FROM_ADDRESS: z.string().trim().toLowerCase().email(),
    EMAIL_FROM_NAME: optional(z.string().trim().min(1).default('Seventh Vote')),
    /** Monitored mailbox for replies; Transactional Send has no default reply mailbox. */
    EMAIL_REPLY_TO: optional(z.string().trim().email().optional()),
    /** Linked as "Privacy Statement" at the foot of verification emails; omitted when unset. */
    PRIVACY_STATEMENT_URL: optional(
      z
        .string()
        .trim()
        .url()
        .refine((value) => value.startsWith('https://'), 'PRIVACY_STATEMENT_URL must use https')
        .optional(),
    ),

    /** Trusted frontend origin used to build links in emails, e.g. https://app.example.gov. */
    APP_BASE_URL: z
      .string()
      .trim()
      .url()
      .transform((value) => value.replace(/\/+$/, '')),

    /** Minutes between runs of the cleanup of expired tokens, codes, invitations and sign-in windows. */
    CLEANUP_INTERVAL_MINUTES: optional(z.coerce.number().int().min(1).max(1440).default(60)),

    /** Hours an emailed workspace invitation link stays usable. */
    INVITATION_TTL_HOURS: optional(z.coerce.number().int().min(1).max(336).default(72)),

    COOKIE_SECURE: booleanFlag,
  })
  .refine((e) => e.EMAIL_FROM_ADDRESS.endsWith(`@${e.NYLAS_SEND_DOMAIN}`), {
    message: 'EMAIL_FROM_ADDRESS must be an address on NYLAS_SEND_DOMAIN',
    path: ['EMAIL_FROM_ADDRESS'],
  });

export type NodeEnvironment = 'development' | 'production' | 'test';
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';


export interface SessionPolicy {
  readonly persistentTtlMs: number;
  readonly browserSessionTtlMs: number;
}

export interface CleanupConfig {
  readonly intervalMs: number;
}

export interface JwtConfig {
  readonly secret: string;
  readonly issuer: string;
  readonly audience: string;
  readonly accessTokenTtlSeconds: number;
}

export interface EmailConfig {
  readonly nylas: {
    readonly apiKey: string;
    readonly apiUri: string;
    readonly sendDomain: string;
  };
  readonly from: { readonly name: string; readonly email: string };
  readonly replyTo: string | null;
  readonly privacyStatementUrl: string | null;
}

export interface AppConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly logLevel: LogLevel;
  readonly port: number;
  readonly databaseUrl: string;
  readonly jwt: JwtConfig;
  readonly session: SessionPolicy;
  readonly cleanup: CleanupConfig;
  readonly otpHmacKey: string;
  readonly email: EmailConfig;
  readonly appBaseUrl: string;
  readonly cookieSecure: boolean;
  readonly invitationTtlMs: number;
}

export class ConfigurationError extends Error {
  override readonly name = 'ConfigurationError';

  constructor(readonly issues: readonly string[]) {
    super(`Invalid environment configuration:\n  - ${issues.join('\n  - ')}`);
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigurationError(
      parsed.error.issues.map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`),
    );
  }
  const e = parsed.data;
  if (e.NODE_ENV === 'production' && !e.APP_BASE_URL.startsWith('https://')) {
    throw new ConfigurationError(['APP_BASE_URL: must use https when NODE_ENV=production']);
  }
  if (e.NODE_ENV === 'production' && !e.COOKIE_SECURE) {
    throw new ConfigurationError(['COOKIE_SECURE: must be true when NODE_ENV=production']);
  }
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
    }),
    cleanup: Object.freeze({
      intervalMs: e.CLEANUP_INTERVAL_MINUTES * MS_PER_MINUTE,
    }),
    session: Object.freeze({
      persistentTtlMs: e.REFRESH_TOKEN_TTL_DAYS * MS_PER_DAY,
      browserSessionTtlMs: e.BROWSER_SESSION_TTL_HOURS * MS_PER_HOUR,
    }),
    otpHmacKey: e.OTP_HMAC_KEY,
    email: Object.freeze({
      nylas: Object.freeze({
        apiKey: e.NYLAS_API_KEY,
        apiUri: e.NYLAS_API_URI,
        sendDomain: e.NYLAS_SEND_DOMAIN,
      }),
      from: Object.freeze({
        name: e.EMAIL_FROM_NAME,
        email: e.EMAIL_FROM_ADDRESS,
      }),
      replyTo: e.EMAIL_REPLY_TO ?? null,
      privacyStatementUrl: e.PRIVACY_STATEMENT_URL ?? null,
    }),
    appBaseUrl: e.APP_BASE_URL,
    cookieSecure: e.COOKIE_SECURE,
    invitationTtlMs: e.INVITATION_TTL_HOURS * MS_PER_HOUR,
  });
}
