import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/features/auth/auth-schema';

export const personalInfoSchema = z.object({
  name: z.string().trim().min(1, 'Enter your full name.').max(120, 'Use a shorter name.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .pipe(z.email('Enter a valid email address, like name@example.gov.')),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

const newPasswordFields = z.object({
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
    .max(PASSWORD_MAX_LENGTH, `Use no more than ${PASSWORD_MAX_LENGTH} characters.`),
  confirmPassword: z.string().min(1, 'Confirm your new password.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    ...newPasswordFields.shape,
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords don’t match.',
    path: ['confirmPassword'],
    when: (payload) => newPasswordFields.safeParse(payload.value).success,
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: 'Choose a password you haven’t used for this account.',
    path: ['newPassword'],
    when: (payload) => newPasswordFields.safeParse(payload.value).success,
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
