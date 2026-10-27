import type { z } from 'zod';

const API_ERROR_CODES = [
  'validation_failed',
  'invalid_code',
  'too_many_attempts',
  'resend_cooldown',
  'account_exists',
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

interface ApiErrorBody {
  code?: ApiErrorCode;
  fieldErrors?: Readonly<Record<string, readonly string[]>>;
  details?: unknown;
}

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly status: number;
  readonly code: ApiErrorCode | undefined;
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;
  readonly details: unknown;

  constructor(
    status: number,
    message: string,
    { code, fieldErrors = {}, details }: ApiErrorBody = {},
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.details = details;
  }
}

export class NetworkError extends Error {
  override readonly name = 'NetworkError';
}

export class ResponseContractError extends Error {
  override readonly name = 'ResponseContractError';
}

interface ApiRequestOptions<T> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  schema: z.ZodType<T>;
  body?: unknown;
  bearer?: string;
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readErrorCode(value: unknown): ApiErrorCode | undefined {
  return API_ERROR_CODES.find((code) => code === value);
}

function readFieldErrors(details: unknown): Record<string, string[]> {
  if (!isRecord(details) || !isRecord(details.fieldErrors)) return {};
  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(details.fieldErrors)) {
    if (Array.isArray(messages)) {
      const strings = messages.filter((m): m is string => typeof m === 'string');
      if (strings.length > 0) result[field] = strings;
    }
  }
  return result;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}


export async function apiRequest<T>(path: string, options: ApiRequestOptions<T>): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.bearer !== undefined) headers.Authorization = `Bearer ${options.bearer}`;

  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'same-origin',
      signal: options.signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new NetworkError('Network request failed');
  }

  const payload = await readJson(response);
  if (!response.ok) {
    const body = isRecord(payload) ? payload : {};
    throw new ApiError(
      response.status,
      typeof body.error === 'string' ? body.error : response.statusText,
      {
        code: readErrorCode(body.code),
        fieldErrors: readFieldErrors(body.details),
        details: body.details,
      },
    );
  }

  const parsed = options.schema.safeParse(payload);
  if (!parsed.success) throw new ResponseContractError('Unexpected response from server');
  return parsed.data;
}
