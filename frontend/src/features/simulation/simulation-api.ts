import { z } from 'zod';
import { withAccessToken } from '@/features/auth/auth-session';
import { apiRequest } from '@/lib/api/http';
import {
  CONFIDENCES,
  DISTRICT_IMPACTS,
  EVIDENCE_PIECE_KINDS,
  FISCAL_IMPACTS,
  SIMULATION_RUN_STATUSES,
  STANCE_LABELS,
  type Ask,
} from '@/types/simulation';

const timestamp = z.iso.datetime({ offset: true });
const textList = z.array(z.string());

const citationSchema = z.object({
  label: z.string(),
  kind: z.enum(EVIDENCE_PIECE_KINDS),
  text: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string(),
});
export type SimulationCitation = z.infer<typeof citationSchema>;

const answerSchema = z.object({
  memberId: z.guid(),
  memberName: z.string(),
  memberSlug: z.string(),
  dossierVersionId: z.guid(),
  versionNo: z.number().int().positive(),
  stance: z.enum(STANCE_LABELS),
  confidence: z.enum(CONFIDENCES),
  answer: z.string(),
  reasoning: z.string(),
  concerns: textList,
  levers: textList,
  questions: textList,
  citations: z.array(citationSchema),
});
export type SimulationAnswer = z.infer<typeof answerSchema>;

export function answerMemberId(answer: SimulationAnswer): string {
  return answer.memberSlug || answer.memberId;
}

const agendaContextSchema = z.object({
  actionType: z.string().optional(),
  fiscalImpact: z.enum(FISCAL_IMPACTS).optional(),
  mayorPriority: z.boolean().optional(),
  districtImpact: z.enum(DISTRICT_IMPACTS).optional(),
  districts: z.array(z.string()).optional(),
  committee: z.string().optional(),
  committeeChair: z.string().optional(),
});
export type SimulationAgendaContext = z.infer<typeof agendaContextSchema>;

const agendaSchema = z.looseObject({
  title: z.string(),
  description: z.string(),
  category: z.string().optional(),
  ask: z.string().optional(),
  context: agendaContextSchema.optional(),
});

const voteRulesSchema = z.object({
  bodySize: z.number().int().positive(),
  majorityThreshold: z.number().int().positive(),
  quorum: z.number().int().positive(),
});

const runSchema = z.object({
  id: z.guid(),
  status: z.enum(SIMULATION_RUN_STATUSES),
  error: z.string(),
  agenda: agendaSchema,
  answers: z.array(answerSchema),
  voteRules: voteRulesSchema.nullable(),
  createdAt: timestamp,
});
export type SimulationRun = z.infer<typeof runSchema>;

export const AGENDA_LIMITS = {
  title: 500,
  description: 20000,
  committee: 300,
} as const;

export interface SimulationAgenda {
  title: string;
  description: string;
  category?: string;
  ask?: Ask;
  context?: SimulationAgendaContext;
}

export type MemberSlugs = readonly [string, ...string[]];

interface RequestOptions {
  signal?: AbortSignal;
}

const SIMULATIONS = '/api/simulations';

export function runSimulation(
  agenda: SimulationAgenda,
  members?: MemberSlugs,
  { signal }: RequestOptions = {},
): Promise<SimulationRun> {
  return withAccessToken((bearer) =>
    apiRequest(SIMULATIONS, {
      method: 'POST',
      bearer,
      body: members ? { agenda, members } : { agenda },
      schema: runSchema,
      signal,
    }),
  );
}
