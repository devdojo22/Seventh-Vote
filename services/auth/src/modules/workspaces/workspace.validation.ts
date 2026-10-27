import { z } from 'zod';
import { emailSchema } from '../../shared/validation/email.js';

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a workspace name')
    .max(120)
    .regex(/^\P{Cc}+$/u, 'Name must not contain control characters'),
  /** Stable, URL-safe identifier, e.g. "memphis-city-council". */
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, digits and single hyphens'),
});

export const designatePrincipalSchema = z.object({ email: emailSchema });

/** The role is never part of the body: Principals and their delegates can only invite Affiliates. */
export const inviteAffiliateSchema = z.object({
  email: emailSchema,
  canEditDossiers: z.boolean().default(false),
});

export const updateMemberSchema = z.object({ canEditDossiers: z.boolean() });

/**
 * Vote rules as counts. Strict: unknown fields are rejected rather than silently dropped, so nothing
 * else (for example a private note) can ride along into a settings request.
 */
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

export const idParamSchema = z.string().uuid();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteAffiliateInput = z.infer<typeof inviteAffiliateSchema>;
export type VoteRulesInput = z.infer<typeof voteRulesSchema>;
