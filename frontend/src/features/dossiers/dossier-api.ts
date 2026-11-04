import { z } from 'zod';
import { withAccessToken } from '@/features/auth/auth-session';
import { apiRequest } from '@/lib/api/http';
import { useCouncilStore } from '@/stores/council-store';
import {
  DATE_PRECISIONS,
  RECORD_OUTCOMES,
  RECORD_TYPES,
  REVIEW_STATUSES,
  STANCE_LABELS,
  type ReviewStatus,
} from '@/types/dossier';


const timestamp = z.iso.datetime({ offset: true });
const source = { sourceName: z.string(), sourceUrl: z.string() };

const committeeSchema = z.object({ committee: z.string(), role: z.string(), year: z.string() });

const issuePositionSchema = z.object({
  topic: z.string(),
  stance: z.string(),
  stanceLabel: z.enum(STANCE_LABELS).nullable(),
  evidence: z.string(),
  ...source,
});

const keyRecordSchema = z.object({
  lineageId: z.guid(),
  title: z.string(),
  type: z.enum(RECORD_TYPES),
  outcome: z.enum(RECORD_OUTCOMES),
  description: z.string(),
  ...source,
  date: z.iso.date().nullable(),
  datePrecision: z.enum(DATE_PRECISIONS),
  dateText: z.string(),
});

const quoteSchema = z.object({
  lineageId: z.guid(),
  text: z.string(),
  context: z.string(),
  verbatim: z.boolean(),
  ...source,
});

const bulletSchema = z.object({ text: z.string(), inferred: z.boolean() });
const mayorAlignmentSchema = z.object({ relationship: z.string(), example: z.string(), ...source });
const voiceExampleSchema = z.object({ quote: z.string(), context: z.string(), ...source });

const contentSchema = z.object({
  name: z.string(),
  initials: z.string(),
  district: z.string(),
  leadershipRole: z.string(),
  tookOffice: z.string(),
  profile: z.string(),
  politicalArchetype: z.string(),
  politicalStyle: z.string(),
  committees: z.array(committeeSchema),
  issuePositions: z.array(issuePositionSchema),
  keyRecords: z.array(keyRecordSchema),
  voiceEvidence: z.object({
    description: z.string(),
    example: voiceExampleSchema,
    quotes: z.array(quoteSchema),
  }),
  decisionPattern: z.object({
    votingBloc: z.string(),
    oppositionTriggers: z.array(bulletSchema),
    persuasionLevers: z.array(bulletSchema),
  }),
  mayorAlignment: mayorAlignmentSchema,
  dataGaps: z.array(z.string()),
});
export type DossierContent = z.infer<typeof contentSchema>;
export type KeyRecord = z.infer<typeof keyRecordSchema>;
export type VoiceQuote = z.infer<typeof quoteSchema>;
export type IssuePosition = z.infer<typeof issuePositionSchema>;

const versionSchema = contentSchema.extend({
  versionNo: z.number().int().positive(),
  status: z.enum(REVIEW_STATUSES),
  changeNote: z.string(),
  createdBy: z.guid(),
  createdAt: timestamp,
});
export type DossierVersion = z.infer<typeof versionSchema>;

const memberSchema = z.object({
  id: z.guid(),
  slug: z.string(),
  name: z.string(),
  initials: z.string(),
  district: z.string(),
  leadershipRole: z.string(),
  tookOffice: z.string(),
  photoUrl: z.string(),
  archived: z.boolean(),
});
export type DossierMember = z.infer<typeof memberSchema>;

const summarySchema = z.object({
  id: z.guid(),
  member: memberSchema,
  currentVersionNo: z.number().int().positive(),
  status: z.enum(REVIEW_STATUSES),
  updatedAt: timestamp,
});
export type DossierSummary = z.infer<typeof summarySchema>;

const detailSchema = z.object({
  id: z.guid(),
  member: memberSchema,
  currentVersion: versionSchema,
});
export type DossierDetail = z.infer<typeof detailSchema>;

const versionSummarySchema = z.object({
  versionNo: z.number().int().positive(),
  status: z.enum(REVIEW_STATUSES),
  changeNote: z.string(),
  createdBy: z.guid(),
  createdAt: timestamp,
  isCurrent: z.boolean(),
});
export type DossierVersionSummary = z.infer<typeof versionSummarySchema>;

const reviewChangeSchema = z.object({
  id: z.guid(),
  versionNo: z.number().int().positive(),
  fromStatus: z.enum(REVIEW_STATUSES),
  toStatus: z.enum(REVIEW_STATUSES),
  changedBy: z.guid(),
  changedAt: timestamp,
});
export type ReviewChange = z.infer<typeof reviewChangeSchema>;

const evidenceSchema = z.discriminatedUnion('kind', [
  issuePositionSchema.extend({ kind: z.literal('issue_position') }),
  keyRecordSchema.extend({ kind: z.literal('key_record') }),
  quoteSchema.extend({ kind: z.literal('quote') }),
  mayorAlignmentSchema.extend({ kind: z.literal('mayor_alignment') }),
  voiceExampleSchema.extend({ kind: z.literal('voice_example') }),
]);
export type EvidenceItem = z.infer<typeof evidenceSchema>;

export type DossierContentInput = Omit<DossierContent, 'keyRecords' | 'voiceEvidence'> & {
  keyRecords: (Omit<KeyRecord, 'lineageId'> & { lineageId?: string })[];
  voiceEvidence: Omit<DossierContent['voiceEvidence'], 'quotes'> & {
    quotes: (Omit<VoiceQuote, 'lineageId'> & { lineageId?: string })[];
  };
};

const DOSSIERS = '/api/dossiers';
const dossierPath = (id: string) => `${DOSSIERS}/${encodeURIComponent(id)}`;

async function changesCouncil<T>(request: Promise<T>): Promise<T> {
  const result = await request;
  useCouncilStore.getState().markStale();
  return result;
}

export function listDossiers({ archived = false } = {}): Promise<DossierSummary[]> {
  return withAccessToken((bearer) =>
    apiRequest(archived ? `${DOSSIERS}?archived=true` : DOSSIERS, {
      method: 'GET',
      bearer,
      schema: z.array(summarySchema),
    }),
  );
}

export function getDossier(id: string): Promise<DossierDetail> {
  return withAccessToken((bearer) =>
    apiRequest(dossierPath(id), { method: 'GET', bearer, schema: detailSchema }),
  );
}

export function createDossier(
  content: DossierContentInput,
  changeNote: string,
): Promise<DossierDetail> {
  return changesCouncil(
    withAccessToken((bearer) =>
      apiRequest(DOSSIERS, {
        method: 'POST',
        bearer,
        body: { content, changeNote },
        schema: detailSchema,
      }),
    ),
  );
}

export function saveDossier(
  id: string,
  baseVersionNo: number,
  content: DossierContentInput,
  changeNote: string,
): Promise<DossierDetail> {
  return changesCouncil(
    withAccessToken((bearer) =>
      apiRequest(dossierPath(id), {
        method: 'PUT',
        bearer,
        body: { baseVersionNo, content, changeNote },
        schema: detailSchema,
      }),
    ),
  );
}

export function archiveDossier(id: string): Promise<void> {
  return changesCouncil(
    withAccessToken((bearer) =>
      apiRequest(dossierPath(id), { method: 'DELETE', bearer, schema: z.undefined() }),
    ),
  );
}

export function restoreDossier(id: string): Promise<DossierDetail> {
  return changesCouncil(
    withAccessToken((bearer) =>
      apiRequest(`${dossierPath(id)}/restore`, { method: 'POST', bearer, schema: detailSchema }),
    ),
  );
}

export function listVersions(id: string): Promise<DossierVersionSummary[]> {
  return withAccessToken((bearer) =>
    apiRequest(`${dossierPath(id)}/versions`, {
      method: 'GET',
      bearer,
      schema: z.array(versionSummarySchema),
    }),
  );
}

export function getVersion(id: string, versionNo: number): Promise<DossierVersion> {
  return withAccessToken((bearer) =>
    apiRequest(`${dossierPath(id)}/versions/${String(versionNo)}`, {
      method: 'GET',
      bearer,
      schema: versionSchema,
    }),
  );
}


export function setReviewStatus(
  id: string,
  status: ReviewStatus,
  versionNo: number,
): Promise<ReviewChange> {
  return withAccessToken((bearer) =>
    apiRequest(`${dossierPath(id)}/review`, {
      method: 'POST',
      bearer,
      body: { status, versionNo },
      schema: reviewChangeSchema,
    }),
  );
}

export function listReviewHistory(id: string): Promise<ReviewChange[]> {
  return withAccessToken((bearer) =>
    apiRequest(`${dossierPath(id)}/review-history`, {
      method: 'GET',
      bearer,
      schema: z.array(reviewChangeSchema),
    }),
  );
}

export function getEvidence(id: string, versionNo?: number): Promise<EvidenceItem[]> {
  const query = versionNo === undefined ? '' : `?version=${String(versionNo)}`;
  return withAccessToken((bearer) =>
    apiRequest(`${dossierPath(id)}/evidence${query}`, {
      method: 'GET',
      bearer,
      schema: z.array(evidenceSchema),
    }),
  );
}
