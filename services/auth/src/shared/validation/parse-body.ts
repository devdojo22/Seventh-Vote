import type { z } from 'zod';
import { HttpError } from '../errors/http-error.js';

export function parseBody<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, body: unknown): T {
  const result = schema.safeParse(body ?? {});
  if (!result.success) throw new HttpError(400, 'Validation failed', { code: 'validation_failed', details: result.error.flatten() });
  return result.data;
}
