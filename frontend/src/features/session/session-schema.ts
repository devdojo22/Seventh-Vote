import { z } from 'zod';
import { AGENDA_LIMITS } from '@/features/simulation/simulation-api';
import type { SessionDefaults } from '@/lib/council-profile';
import type { Member } from '@/types/member';
import {
  ASKS,
  ATTENDANCE_STATUSES,
  CATEGORY_IDS,
  DISTRICT_IMPACTS,
  FISCAL_IMPACTS,
  PRIORITIES,
  type SessionInput,
} from '@/types/simulation';

export const sessionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Add an agenda item.')
      .max(AGENDA_LIMITS.title, `Keep the title under ${AGENDA_LIMITS.title} characters.`),
    desc: z
      .string()
      .trim()
      .min(1, 'Add a description.')
      .max(
        AGENDA_LIMITS.description,
        `Keep the description under ${AGENDA_LIMITS.description.toLocaleString()} characters.`,
      ),
    category: z.enum(CATEGORY_IDS),
    actionType: z.string().min(1),
    committee: z.string().trim().max(AGENDA_LIMITS.committee, 'Shorten the committee name.'),
    committeeChair: z.string().trim().max(AGENDA_LIMITS.committee, 'Shorten the chair name.'),
    fiscal: z.enum(FISCAL_IMPACTS),
    ask: z.enum(ASKS),
    impact: z.enum(DISTRICT_IMPACTS),
    priority: z.enum(PRIORITIES),
    districts: z.array(z.string()),
    attendance: z
      .record(z.string(), z.enum(ATTENDANCE_STATUSES))
      .refine((a) => Object.values(a).includes('present'), 'Mark at least one member present.'),
  })
  .refine((v) => v.impact !== 'specific' || v.districts.length > 0, {
    message: 'Choose at least one affected district.',
    path: ['districts'],
  }) satisfies z.ZodType<SessionInput>;

export function defaultSessionValues(members: Member[], defaults: SessionDefaults): SessionInput {
  return {
    ...defaults,
    districts: members[0] ? [members[0].district] : [],
    attendance: Object.fromEntries(members.map((m) => [m.id, 'present' as const])),
  };
}
