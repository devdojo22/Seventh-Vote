import { z } from 'zod';
import type { EmailConfig } from '../../config/environment.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

class EmailProviderError extends Error {
  override readonly name = 'EmailProviderError';

  constructor(
    readonly status: number,
    readonly errorType: string | null,
    readonly requestId: string | null,
  ) {
    super(`Email provider responded with HTTP ${status}`);
  }
}

const acceptedSchema = z.object({ data: z.object({}).passthrough() });
const failureSchema = z.object({
  request_id: z.string().optional(),
  error: z.object({ type: z.string() }).optional(),
});

const SEND_TIMEOUT_MS = 30_000;

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}


export class NylasEmailSender implements EmailSender {
  private readonly sendUrl: string;

  constructor(private readonly config: EmailConfig) {
    const { apiUri, sendDomain } = config.nylas;
    this.sendUrl = `${apiUri}/v3/domains/${encodeURIComponent(sendDomain)}/messages/send`;
  }

  async send({ to, subject, html }: EmailMessage): Promise<void> {
    const { from, replyTo, nylas } = this.config;
    const response = await fetch(this.sendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${nylas.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: [{ email: to }],
        from: [from],
        ...(replyTo === null ? {} : { reply_to: [{ email: replyTo }] }),
        subject,
        body: html,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    const payload = await readJson(response);
    if (response.ok && acceptedSchema.safeParse(payload).success) return;

    const failure = failureSchema.safeParse(payload);
    throw new EmailProviderError(
      response.status,
      failure.success ? (failure.data.error?.type ?? null) : null,
      failure.success ? (failure.data.request_id ?? null) : null,
    );
  }
}

/** HTTP statuses after which the provider may still have sent the message (timeout or unknown server state). */
const AMBIGUOUS_STATUSES = new Set([408, 500, 502, 504]);
/** Connection failures that happen before any request reaches the provider. */
const NOT_CONNECTED_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'EHOSTUNREACH', 'ENETUNREACH']);

function causeCode(error: Error): string | null {
  const cause: unknown = error.cause;
  if (typeof cause !== 'object' || cause === null || !('code' in cause)) return null;
  return typeof cause.code === 'string' ? cause.code : null;
}


export function isDefinitelyUndelivered(error: unknown): boolean {
  if (error instanceof EmailProviderError) {
    if (error.status === 503) return true;
    return error.status >= 400 && error.status < 500 && !AMBIGUOUS_STATUSES.has(error.status);
  }
  if (error instanceof Error) {
    const code = causeCode(error);
    return code !== null && NOT_CONNECTED_CODES.has(code);
  }
  return false;
}

export function describeDeliveryError(error: unknown): Record<string, string | number> {
  if (error instanceof EmailProviderError) {
    return {
      name: error.name,
      status: error.status,
      ...(error.errorType === null ? {} : { errorType: error.errorType }),
      ...(error.requestId === null ? {} : { requestId: error.requestId }),
    };
  }
  if (error instanceof Error) return { name: error.name };
  return { name: 'unknown' };
}
