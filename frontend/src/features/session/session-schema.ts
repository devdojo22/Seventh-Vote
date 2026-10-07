import { z } from 'zod';
import { SESSION_DEFAULTS } from '@/data/session-defaults';
import type { Member } from '@/types/member';
import {
  ACTION_TYPES,
  ASKS,
  ATTENDANCE_STATUSES,
  CATEGORY_IDS,
  DISTRICT_IMPACTS,
  FISCAL_IMPACTS,
  PRIORITIES,
  type SessionInput,
} from '@/types/simulation';

export const sessionSchema = z.object({
  title: z.string().trim().min(1, 'Add an agenda item.'),
  desc: z.string().trim().min(1, 'Add a description.'),
  category: z.enum(CATEGORY_IDS),
  actionType: z.enum(ACTION_TYPES),
  committee: z.string().trim(),
  committeeChair: z.string().trim(),
  fiscal: z.enum(FISCAL_IMPACTS),
  ask: z.enum(ASKS),
  impact: z.enum(DISTRICT_IMPACTS),
  priority: z.enum(PRIORITIES),
  districts: z.array(z.string()),
  attendance: z
    .record(z.string(), z.enum(ATTENDANCE_STATUSES))
    .refine((a) => Object.values(a).includes('present'), 'Mark at least one member present.'),
}) satisfies z.ZodType<SessionInput>;

export function defaultSessionValues(members: Member[]): SessionInput {
  return {
    ...SESSION_DEFAULTS,
    districts: members[0] ? [members[0].district] : [],
    attendance: Object.fromEntries(members.map((m) => [m.id, 'present' as const])),
  };
}
