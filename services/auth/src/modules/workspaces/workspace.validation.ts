import { PreviousPrincipalOutcome } from '@prisma/client';
import { z } from 'zod';
import { RECUSAL_MODES, TIE_BREAKS } from '../../shared/types/api.types.js';
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

export const deleteWorkspaceSchema = z.object({ confirmSlug: z.string().trim().min(1).max(60) }).strict();

export const inviteAffiliateSchema = z.object({
  email: emailSchema,
  canEditDossiers: z.boolean().default(false),
  canApproveDossiers: z.boolean().default(false),
});

export const updateMemberSchema = z
  .object({ canEditDossiers: z.boolean().optional(), canApproveDossiers: z.boolean().optional() })
  .strict()
  .refine((body) => body.canEditDossiers !== undefined || body.canApproveDossiers !== undefined, {
    message: 'Send canEditDossiers or canApproveDossiers',
  });

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;


export const voteThresholdSchema = z.union([
  z.object({ type: z.literal('count'), needed: z.number().int().min(1).max(1000) }).strict(),
  z
    .object({
      type: z.literal('fraction'),
      numerator: z.number().int().min(1).max(100),
      denominator: z.number().int().min(1).max(100),
      of: z.enum(['seats', 'present']),
    })
    .strict()
    .refine((t) => t.numerator <= t.denominator, { message: 'A fraction cannot be more than 1', path: ['numerator'] }),
  z.object({ type: z.literal('present_majority') }).strict(),
  z.object({ type: z.literal('consent') }).strict(),
]);

const singleLine = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^\P{Cc}*$/u, 'Must not contain control characters');

export const actionVoteRuleSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-z][a-z0-9_]{1,39}$/, 'Use 2–40 lowercase letters, digits or underscores, starting with a letter')
      .refine((id) => id !== 'ordinary', 'Ordinary passage is set by majorityThreshold'),
    label: singleLine(80).min(1, 'Enter a label'),
    threshold: voteThresholdSchema,
    note: singleLine(200).default(''),
    verified: z.boolean().default(true),
  })
  .strict();

export const VOTE_ACTIONS_MAX = 30;

export const voteRulesSchema = z
  .object({
    bodySize: z.number().int().min(1).max(1000),
    majorityThreshold: z.number().int().min(1),
    quorum: z.number().int().min(1),
    actions: z
      .array(actionVoteRuleSchema)
      .max(VOTE_ACTIONS_MAX, `Use at most ${String(VOTE_ACTIONS_MAX)} action types`)
      .refine((actions) => new Set(actions.map((a) => a.id)).size === actions.length, {
        message: 'Each action type needs its own id',
      })
      .optional(),
    recusal: z.enum(RECUSAL_MODES).optional(),
    tieBreak: z.enum(TIE_BREAKS).optional(),
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
