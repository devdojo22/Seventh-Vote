import { z } from 'zod';

const source = { source_name: z.string(), source_url: z.string() };

const issuePositionSchema = z.object({
  stance: z.string(),
  evidence: z.string(),
  ...source,
});

const keyVoteSchema = z.object({
  id: z.string(),
  date: z.string(),
  item: z.string(),
  position: z.string(),
  ...source,
});

const notableQuoteSchema = z.object({
  id: z.string(),
  quote: z.string(),
  ...source,
  context: z.string().optional(),
  verbatim: z.boolean().optional(),
});

const mayorAlignmentSchema = z.object({
  relationship: z.string().optional(),
  example: z.string().optional(),
  source_name: z.string().optional(),
  source_url: z.string().optional(),
});

const politicalStyleSchema = z.object({ archetype: z.string(), description: z.string() });

const twinVoiceSchema = z.object({
  style: z.string(),
  example_quote: z.string(),
  example_context: z.string(),
  ...source,
});

export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  district: z.string(),
  took_office: z.union([z.string(), z.number()]).transform(String),
  leadership_role: z.string(),
  bio: z.string(),
  voting_bloc: z.string(),
  committees: z.record(z.string(), z.string()),
  /** Keyed by category id, e.g. "economic_development_pilots". */
  issue_positions: z.record(z.string(), issuePositionSchema),
  key_votes: z.array(keyVoteSchema),
  notable_quotes: z.array(notableQuoteSchema),
  opposition_triggers: z.array(z.string()),
  persuasion_levers: z.array(z.string()),
  data_gaps: z.array(z.string()),
  mayor_alignment: z.union([z.string(), mayorAlignmentSchema]),
  political_style: z.union([z.string(), politicalStyleSchema]),
  twin_voice: z.union([z.string(), twinVoiceSchema]),
});

export const memberListSchema = z.array(memberSchema);

export type Member = z.infer<typeof memberSchema>;
export type MemberId = Member['id'];
export type IssuePosition = z.infer<typeof issuePositionSchema>;
export type KeyVote = z.infer<typeof keyVoteSchema>;
export type MayorAlignment = z.infer<typeof mayorAlignmentSchema>;
export type PoliticalStyle = z.infer<typeof politicalStyleSchema>;
export type TwinVoice = z.infer<typeof twinVoiceSchema>;
