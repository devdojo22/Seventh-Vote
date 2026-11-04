import { z } from 'zod';
import { isHttpUrl } from '@/lib/url';
import {
  DATE_PRECISIONS,
  DOSSIER_LIMITS as LIMIT,
  RECORD_OUTCOMES,
  RECORD_TYPES,
  STANCE_LABELS,
} from '@/types/dossier';
import type { DossierContent, DossierContentInput } from './dossier-api';

export const CHANGE_NOTE_MAX = LIMIT.changeNote;

const tooLong = (max: number) => `Use at most ${max.toLocaleString('en-US')} characters.`;
const text = (max: number) => z.string().trim().max(max, tooLong(max));
const required = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, tooLong(max));
/** A repeated section, capped like the API; the editor also stops offering "Add" at the cap. */
const list = <T extends z.ZodType>(item: T, max: number) =>
  z.array(item).max(max, `Keep at most ${String(max)} entries.`);
const sourceUrl = text(LIMIT.sourceUrl).refine(
  (v) => v === '' || isHttpUrl(v),
  'Use a full link starting with http:// or https://.',
);
const source = { sourceName: text(LIMIT.sourceName), sourceUrl };
const bullet = z.object({
  text: required('Enter some text or remove this line.', LIMIT.itemText),
  inferred: z.boolean(),
});

export const dossierFormSchema = z
  .object({
    name: required('Enter the member’s name.', LIMIT.name),
    initials: text(LIMIT.initials),
    district: text(LIMIT.district),
    leadershipRole: text(LIMIT.paragraph),
    tookOffice: text(LIMIT.tookOffice),
    profile: text(LIMIT.longText),
    politicalArchetype: text(LIMIT.shortLabel),
    politicalStyle: text(LIMIT.longText),
    committees: list(
      z.object({
        committee: required('Enter the committee name.', LIMIT.shortLabel),
        role: text(LIMIT.shortLabel),
        year: text(LIMIT.year),
      }),
      LIMIT.list,
    ),
    issuePositions: list(
      z.object({
        topic: required('Choose an issue.', LIMIT.shortLabel),
        stance: text(LIMIT.paragraph),
        stanceLabel: z.union([z.literal(''), z.enum(STANCE_LABELS)]),
        evidence: text(LIMIT.paragraph),
        ...source,
      }),
      LIMIT.list,
    ),
    keyRecords: list(
      z.object({
        lineageId: z.string().optional(),
        title: required('Describe the vote or action.', LIMIT.recordTitle),
        type: z.enum(RECORD_TYPES),
        outcome: z.enum(RECORD_OUTCOMES),
        description: text(LIMIT.paragraph),
        date: z.union([z.literal(''), z.iso.date('Use a full date.')]),
        datePrecision: z.enum(DATE_PRECISIONS),
        dateText: text(LIMIT.dateText),
        ...source,
      }),
      LIMIT.keyRecords,
    ),
    voiceDescription: text(LIMIT.longText),
    voiceExample: z.object({
      quote: text(LIMIT.paragraph),
      context: text(LIMIT.context),
      ...source,
    }),
    quotes: list(
      z.object({
        lineageId: z.string().optional(),
        text: required('Enter the quote.', LIMIT.paragraph),
        context: text(LIMIT.context),
        verbatim: z.boolean(),
        ...source,
      }),
      LIMIT.quotes,
    ),
    votingBloc: text(LIMIT.longText),
    oppositionTriggers: list(bullet, LIMIT.list),
    persuasionLevers: list(bullet, LIMIT.list),
    mayorAlignment: z.object({
      relationship: text(LIMIT.shortLabel),
      example: text(LIMIT.longText),
      ...source,
    }),
    dataGaps: list(
      z.object({ value: required('Enter some text or remove this line.', LIMIT.itemText) }),
      LIMIT.list,
    ),
    changeNote: required('Say briefly what changed and why.', CHANGE_NOTE_MAX),
  })
  .superRefine((values, ctx) => {
    const seen = new Set<string>();
    values.issuePositions.forEach((p, index) => {
      if (seen.has(p.topic)) {
        ctx.addIssue({
          code: 'custom',
          message: 'This issue is already listed.',
          path: ['issuePositions', index, 'topic'],
        });
      }
      seen.add(p.topic);
    });
  });

export type DossierFormValues = z.infer<typeof dossierFormSchema>;

const EMPTY_SOURCE = { sourceName: '', sourceUrl: '' };

export function toFormValues(content: DossierContent | null): DossierFormValues {
  return {
    name: content?.name ?? '',
    initials: content?.initials ?? '',
    district: content?.district ?? '',
    leadershipRole: content?.leadershipRole ?? '',
    tookOffice: content?.tookOffice ?? '',
    profile: content?.profile ?? '',
    politicalArchetype: content?.politicalArchetype ?? '',
    politicalStyle: content?.politicalStyle ?? '',
    committees: content?.committees.map((c) => ({ ...c })) ?? [],
    issuePositions:
      content?.issuePositions.map((p) => ({ ...p, stanceLabel: p.stanceLabel ?? '' })) ?? [],
    keyRecords: content?.keyRecords.map((r) => ({ ...r, date: r.date ?? '' })) ?? [],
    voiceDescription: content?.voiceEvidence.description ?? '',
    voiceExample: content
      ? { ...content.voiceEvidence.example }
      : { quote: '', context: '', ...EMPTY_SOURCE },
    quotes: content?.voiceEvidence.quotes.map((q) => ({ ...q })) ?? [],
    votingBloc: content?.decisionPattern.votingBloc ?? '',
    oppositionTriggers: content?.decisionPattern.oppositionTriggers.map((b) => ({ ...b })) ?? [],
    persuasionLevers: content?.decisionPattern.persuasionLevers.map((b) => ({ ...b })) ?? [],
    mayorAlignment: content
      ? { ...content.mayorAlignment }
      : { relationship: '', example: '', ...EMPTY_SOURCE },
    dataGaps: content?.dataGaps.map((value) => ({ value })) ?? [],
    changeNote: '',
  };
}

export function fromFormValues(v: DossierFormValues): DossierContentInput {
  return {
    name: v.name,
    initials: v.initials,
    district: v.district,
    leadershipRole: v.leadershipRole,
    tookOffice: v.tookOffice,
    profile: v.profile,
    politicalArchetype: v.politicalArchetype,
    politicalStyle: v.politicalStyle,
    committees: v.committees,
    issuePositions: v.issuePositions.map((p) => ({
      ...p,
      stanceLabel: p.stanceLabel === '' ? null : p.stanceLabel,
    })),
    keyRecords: v.keyRecords.map(({ lineageId, ...r }) => ({
      ...r,
      date: r.date === '' ? null : r.date,
      // Sent back unchanged so the record keeps its identity across versions (M4 citations).
      ...(lineageId ? { lineageId } : {}),
    })),
    voiceEvidence: {
      description: v.voiceDescription,
      example: v.voiceExample,
      quotes: v.quotes.map(({ lineageId, ...q }) => ({
        ...q,
        ...(lineageId ? { lineageId } : {}),
      })),
    },
    decisionPattern: {
      votingBloc: v.votingBloc,
      oppositionTriggers: v.oppositionTriggers,
      persuasionLevers: v.persuasionLevers,
    },
    mayorAlignment: v.mayorAlignment,
    dataGaps: v.dataGaps.map((g) => g.value),
  };
}

export function sameContent(a: DossierContentInput, b: DossierContentInput): boolean {
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [key, canonical((value as Record<string, unknown>)[key])]),
      );
    }
    return value;
  };
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}
