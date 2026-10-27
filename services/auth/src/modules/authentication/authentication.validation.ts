import { z } from 'zod';
import { emailSchema } from '../../shared/validation/email.js';
import { OTP_LENGTH } from '../mfa/email-otp.service.js';

export const BCRYPT_MAX_PASSWORD_BYTES = 72;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_INPUT_MAX_LENGTH = 200;

const PERSON_NAME_MAX_LENGTH = 60;

export function personNameSchema(label: string) {
  return z
    .string()
    .trim()
    .min(1, `Enter your ${label}`)
    .max(PERSON_NAME_MAX_LENGTH)
    .regex(/^\P{Cc}+$/u, 'Name must not contain control characters');
}

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_INPUT_MAX_LENGTH)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= BCRYPT_MAX_PASSWORD_BYTES, {
    message: `Password must be at most ${BCRYPT_MAX_PASSWORD_BYTES} bytes`,
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(PASSWORD_INPUT_MAX_LENGTH),
  remember: z.boolean().default(false),
});

export const mfaCodeSchema = z.object({
  code: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`)),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((body) => body.password === body.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(PASSWORD_INPUT_MAX_LENGTH),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((body) => body.newPassword === body.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((body) => body.newPassword !== body.currentPassword, {
    message: 'Choose a password you have not used for this account',
    path: ['newPassword'],
  });
