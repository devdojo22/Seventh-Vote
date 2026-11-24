import { z } from 'zod';
import type { PrepValues } from './prep-brief';
import { AGENDA_LIMITS } from '@/features/simulation/simulation-api';
import { ASKS, CATEGORY_IDS } from '@/types/simulation';

export const prepSchema = z.object({
  memberId: z.string().min(1, 'Choose a council member.'),
  category: z.enum(CATEGORY_IDS),
  ask: z.enum(ASKS),
  pitch: z
    .string()
    .trim()
    .min(1, 'Describe your pitch.')
    .max(
      AGENDA_LIMITS.description,
      `Keep the pitch under ${AGENDA_LIMITS.description.toLocaleString()} characters.`,
    ),
}) satisfies z.ZodType<PrepValues>;
