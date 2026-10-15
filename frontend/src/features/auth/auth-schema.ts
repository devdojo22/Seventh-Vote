import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .pipe(z.email('Enter a valid email address, like name@example.gov.'));

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

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Enter your full name.').max(120, 'Use a shorter name.'),
    email,
    ...passwordFields.shape,
    acceptTerms: z
      .boolean()
      .refine(Boolean, 'Accept the Terms of Service and Privacy Policy to continue.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords don’t match.',
    path: ['confirmPassword'],
    when: (payload) => passwordFields.safeParse(payload.value).success,
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const MFA_CODE_LENGTH = 6;

export function mfaCodeError(code: string): string | null {
  if (!code) return `Enter the ${MFA_CODE_LENGTH}-digit code from your authenticator app.`;
  if (!/^\d+$/.test(code)) return 'Codes contain numbers only.';
  if (code.length < MFA_CODE_LENGTH) {
    return `Enter all ${MFA_CODE_LENGTH} digits (${code.length} of ${MFA_CODE_LENGTH} entered).`;
  }
  return null;
}

export interface PasswordCheck {
  label: string;
  met: boolean;
}

export function passwordChecks(password: string): PasswordCheck[] {
  return [
    {
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      label: 'Upper- and lowercase letters',
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { label: 'A number', met: /\d/.test(password) },
    { label: 'A symbol', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  if (password.length < PASSWORD_MIN_LENGTH) return 1;
  return passwordChecks(password).filter((c) => c.met).length as PasswordStrength;
}
