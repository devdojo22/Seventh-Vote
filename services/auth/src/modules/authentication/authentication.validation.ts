import { z } from 'zod';

/** bcrypt ignores every byte after the 72nd, so longer passwords would be silently truncated. */
export const BCRYPT_MAX_PASSWORD_BYTES = 72;
export const PASSWORD_MIN_LENGTH = 12;
/** Upper bound on what login accepts, kept from the JS service so existing accounts are never locked out. */
export const PASSWORD_INPUT_MAX_LENGTH = 200;

const emailSchema = z
  .string()
  .email()
  .transform((value) => value.toLowerCase());

/** Rules for choosing a new password (registration, seeding). */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_INPUT_MAX_LENGTH)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= BCRYPT_MAX_PASSWORD_BYTES, {
    message: `Password must be at most ${BCRYPT_MAX_PASSWORD_BYTES} bytes`,
  });

export const registerSchema = z.object({ email: emailSchema, password: newPasswordSchema });
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(PASSWORD_INPUT_MAX_LENGTH),
});
export const mfaCodeSchema = z.object({ code: z.string().regex(/^\d{6}$/) });
