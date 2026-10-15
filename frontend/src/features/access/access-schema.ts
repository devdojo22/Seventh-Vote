import { z } from 'zod';
import { ROLES, type AccessUser, type UserInput, type Workspace } from '@/types/access';

export const userFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter the user’s full name.').max(120, 'Use a shorter name.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter an email address.')
    .pipe(z.email('Enter a valid email address, like name@example.gov.')),
  access: z
    .record(z.string(), z.object({ assigned: z.boolean(), role: z.enum(ROLES) }))
    .refine((a) => Object.values(a).some((w) => w.assigned), {
      message: 'Give access to at least one workspace.',
      path: ['root'],
    }),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export function toFormValues(workspaces: Workspace[], user?: AccessUser): UserFormValues {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    access: Object.fromEntries(
      workspaces.map((w) => {
        const membership = user?.memberships.find((m) => m.workspaceId === w.id);
        return [w.id, { assigned: Boolean(membership), role: membership?.role ?? 'STAFF' }];
      }),
    ),
  };
}

export function toUserInput(workspaces: Workspace[], values: UserFormValues): UserInput {
  return {
    name: values.name,
    email: values.email.toLowerCase(),
    memberships: workspaces.flatMap((w) => {
      const access = values.access[w.id];
      return access?.assigned ? [{ workspaceId: w.id, role: access.role }] : [];
    }),
  };
}
