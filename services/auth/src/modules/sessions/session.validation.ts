import { z } from 'zod';

export const switchWorkspaceSchema = z.object({ workspaceId: z.string().uuid() });

export type SwitchWorkspaceInput = z.infer<typeof switchWorkspaceSchema>;
