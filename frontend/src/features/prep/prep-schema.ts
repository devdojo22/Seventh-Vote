import { z } from 'zod';
import type { PrepValues } from '@/lib/simulation/prep-brief';
import { ASKS, CATEGORY_IDS } from '@/types/simulation';

export const prepSchema = z.object({
  memberId: z.string().min(1, 'Choose a council member.'),
  category: z.enum(CATEGORY_IDS),
  ask: z.enum(ASKS),
  pitch: z.string().trim().min(1, 'Describe your pitch.'),
}) satisfies z.ZodType<PrepValues>;
