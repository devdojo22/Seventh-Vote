import { z } from 'zod';
import { newPasswordSchema, personNameSchema } from '../authentication/authentication.validation.js';

const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32,128}$/);

export const invitationTokenBodySchema = z.object({ token: invitationTokenSchema });

export const acceptInvitationSchema = z
  .object({
    token: invitationTokenSchema,
    firstName: personNameSchema('first name'),
    lastName: personNameSchema('last name'),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((body) => body.password === body.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .transform(({ token, firstName, lastName, password }) => ({ token, firstName, lastName, password }));

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
