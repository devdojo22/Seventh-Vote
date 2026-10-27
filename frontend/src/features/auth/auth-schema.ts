import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 200;

export const emailAddress = (required: string) =>
  z
    .string()
    .trim()
    .min(1, required)
    .pipe(z.email('Enter a valid email address, like name@example.gov.'));

const email = emailAddress('Enter your email address.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
  remember: z.boolean(),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const passwordFields = z.object({
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
    .max(PASSWORD_MAX_LENGTH, `Use no more than ${PASSWORD_MAX_LENGTH} characters.`),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
});

const PASSWORD_MAX_BYTES = 72;
const PERSON_NAME_MAX_LENGTH = 60;

const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${label}.`)
    .max(PERSON_NAME_MAX_LENGTH, 'Use a shorter name.')
    .regex(/^\P{Cc}+$/u, 'Your name contains characters that aren’t allowed.');

const utf8Length = (value: string) => new TextEncoder().encode(value).length;

export const newPasswordSchema = passwordFields.shape.password.refine(
  (value) => utf8Length(value) <= PASSWORD_MAX_BYTES,
  'This password is too long. Use fewer characters, or fewer emoji and accented letters.',
);

const newPasswordFields = z.object({
  password: newPasswordSchema,
  confirmPassword: passwordFields.shape.confirmPassword,
});

export const acceptInvitationSchema = z
  .object({
    firstName: personName('first name'),
    lastName: personName('last name'),
    ...newPasswordFields.shape,
    acceptTerms: z
      .boolean()
      .refine(Boolean, 'Accept the Terms of Service and Privacy Policy to continue.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords don’t match.',
    path: ['confirmPassword'],
    when: (payload) => newPasswordFields.safeParse(payload.value).success,
  });

export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;

export const resetPasswordSchema = newPasswordFields.refine(
  (v) => v.password === v.confirmPassword,
  { message: 'Passwords don’t match.', path: ['confirmPassword'] },
);

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const MFA_CODE_LENGTH = 8;

export function mfaCodeError(code: string): string | null {
  if (!code) return `Enter the ${MFA_CODE_LENGTH}-digit code from your email.`;
  if (!/^\d+$/.test(code)) return 'Codes contain numbers only.';
  if (code.length < MFA_CODE_LENGTH) {
    return `Enter all ${MFA_CODE_LENGTH} digits (${code.length} of ${MFA_CODE_LENGTH} entered).`;
  }
  return null;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

const PASSPHRASE_LENGTH = 16;

const CHARACTER_CLASSES = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];


export function passwordStrength(password: string): PasswordStrength | null {
  if (!password) return null;
  if (password.length < PASSWORD_MIN_LENGTH) return 'weak';
  const variety = CHARACTER_CLASSES.filter((pattern) => pattern.test(password)).length;
  const score = variety + (password.length >= PASSPHRASE_LENGTH ? 1 : 0);
  return score >= 4 ? 'strong' : 'medium';
}
