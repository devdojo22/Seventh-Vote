import type { z } from 'zod';
import { HttpError } from '../errors/http-error.js';

/**
 * Validates an untrusted request body. Express types `req.body` as `any`, so every
 * controller funnels it through here to get a typed value or a 400.
 */
export function parseBody<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, body: unknown): T {
  const result = schema.safeParse(body ?? {});
  if (!result.success) throw new HttpError(400, 'Validation failed', result.error.flatten());
  return result.data;
}
