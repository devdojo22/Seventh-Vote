import type { ErrorCode } from '../types/api.types.js';

export class HttpError extends Error {
  override readonly name = 'HttpError';
  readonly code: ErrorCode | undefined;
  readonly details: unknown;

  constructor(
    readonly status: number,
    message: string,
    { code, details }: { code?: ErrorCode | undefined; details?: unknown } = {},
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}
