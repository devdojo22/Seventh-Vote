import { PreviousPrincipalOutcome } from '@prisma/client';
import { z } from 'zod';
import { emailSchema } from '../../shared/validation/email.js';
import { AFFILIATE_SEAT_LIMIT_MAX } from './affiliate-seats.js';

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a workspace name')
    .max(120)
    .regex(/^\P{Cc}+$/u, 'Name must not contain control characters'),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, digits and single hyphens'),
});

export const designatePrincipalSchema = z.object({
  email: emailSchema,
  previousPrincipal: z.nativeEnum(PreviousPrincipalOutcome).default(PreviousPrincipalOutcome.REMOVE),
});

/** The workspace's slug, typed by the super-admin to confirm a permanent deletion. */
export const deleteWorkspaceSchema = z.object({ confirmSlug: z.string().trim().min(1).max(60) }).strict();

export const inviteAffiliateSchema = z.object({
  email: emailSchema,
  canEditDossiers: z.boolean().default(false),
});

export const updateMemberSchema = z.object({ canEditDossiers: z.boolean() });


export const voteRulesSchema = z
  .object({
    bodySize: z.number().int().min(1).max(1000),
    majorityThreshold: z.number().int().min(1),
    quorum: z.number().int().min(1),
  })
  .strict()
  .refine((rules) => rules.majorityThreshold <= rules.bodySize, {
    message: 'Majority threshold cannot exceed the body size',
    path: ['majorityThreshold'],
  })
  .refine((rules) => rules.quorum <= rules.bodySize, {
    message: 'Quorum cannot exceed the body size',
    path: ['quorum'],
  });

export const updateSettingsSchema = z.object({ voteRules: voteRulesSchema }).strict();

/** null: unlimited. */
export const updateSeatLimitSchema = z
  .object({
    seatLimit: z
      .number()
      .int('Use a whole number')
      .min(0, 'Use 0 or more')
      .max(AFFILIATE_SEAT_LIMIT_MAX, `Use at most ${String(AFFILIATE_SEAT_LIMIT_MAX)}`)
      .nullable(),
  })
  .strict();

export const idParamSchema = z.string().uuid();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type DesignatePrincipalInput = z.infer<typeof designatePrincipalSchema>;
export type InviteAffiliateInput = z.infer<typeof inviteAffiliateSchema>;
export type VoteRulesInput = z.infer<typeof voteRulesSchema>;
export type UpdateSeatLimitInput = z.infer<typeof updateSeatLimitSchema>;
