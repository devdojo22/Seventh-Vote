import { z } from 'zod';
import { newPasswordSchema } from '@/features/auth/auth-schema';

const newPasswordFields = z.object({
  newPassword: newPasswordSchema,
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
