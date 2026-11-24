import { z } from 'zod';
import {
  FRACTION_BASES,
  RECUSAL_MODES,
  TIE_BREAKS,
  type ActionVoteRule,
  type RecusalMode,
  type SavedVoteProcedure,
  type TieBreak,
  type VoteRules,
  type VoteThreshold,
} from './access-api';

export const VOTE_ACTIONS_MAX = 30;

export const THRESHOLD_TYPES = [
  'count',
  'fraction',
  'present_majority',
  'consent',
] as const satisfies readonly VoteThreshold['type'][];
export type ThresholdType = VoteThreshold['type'];

export const THRESHOLD_TYPE_LABELS: Record<ThresholdType, string> = {
  count: 'Fixed number of votes',
  fraction: 'Fraction (e.g. two-thirds)',
  present_majority: 'Majority of members present',
  consent: 'Consent (one objection removes it)',
};

export const RECUSAL_LABELS: Record<RecusalMode, { label: string; hint: string }> = {
  excluded: {
    label: 'Not counted as present',
    hint: 'A recused member leaves the room for the vote: “majority of those present” counts only the others.',
  },
  present: {
    label: 'Counted as a present abstention',
    hint: 'A recused member still counts as present but can’t vote yes, which raises the bar for present-based votes.',
  },
};

export const TIE_BREAK_LABELS: Record<TieBreak, { label: string; hint: string }> = {
  fails: { label: 'The item fails', hint: 'A tied “majority of those present” vote fails.' },
  chair: { label: 'The chair decides', hint: 'The presiding officer breaks a tied vote.' },
  passes: { label: 'The item passes', hint: 'A tied vote is enough to pass.' },
};

export function describeThreshold(threshold: VoteThreshold, bodySize: number): string {
  switch (threshold.type) {
    case 'count':
      return `${String(threshold.needed)} of ${String(bodySize)} seats`;
    case 'fraction':
      return `${String(threshold.numerator)}/${String(threshold.denominator)} of ${threshold.of === 'seats' ? 'all seats' : 'members present'}`;
    case 'present_majority':
      return 'Majority of members present';
    case 'consent':
      return 'Consent: one objection removes it';
  }
}


const optionalNumber = z.union([z.number(), z.nan()]);

const actionRowSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1, 'Enter a name.').max(80, 'Use at most 80 characters.'),
  type: z.enum(THRESHOLD_TYPES),
  needed: optionalNumber,
  numerator: optionalNumber,
  denominator: optionalNumber,
  of: z.enum(FRACTION_BASES),
  note: z.string().trim().max(200, 'Use at most 200 characters.'),
  verified: z.boolean(),
});
export type ActionRow = z.infer<typeof actionRowSchema>;

const count = (label: string) =>
  z
    .number({ error: `Enter the ${label}.` })
    .int('Use a whole number.')
    .min(1, 'Use at least 1.');

const isWhole = (n: number, min: number, max: number) =>
  Number.isInteger(n) && n >= min && n <= max;

export const voteRulesFormSchema = z
  .object({
    bodySize: count('body size').max(1000, 'Use at most 1000.'),
    majorityThreshold: count('majority threshold'),
    quorum: count('quorum'),
    recusal: z.enum(RECUSAL_MODES),
    tieBreak: z.enum(TIE_BREAKS),
    actions: z
      .array(actionRowSchema)
      .max(VOTE_ACTIONS_MAX, `Use at most ${String(VOTE_ACTIONS_MAX)} action types.`),
  })
  .superRefine((v, ctx) => {
    if (v.majorityThreshold > v.bodySize) {
      ctx.addIssue({
        code: 'custom',
        message: 'Can’t be more than the body size.',
        path: ['majorityThreshold'],
      });
    }
    if (v.quorum > v.bodySize) {
      ctx.addIssue({
        code: 'custom',
        message: 'Can’t be more than the body size.',
        path: ['quorum'],
      });
    }
    const labels = new Set<string>();
    v.actions.forEach((row, i) => {
      const at = (field: keyof ActionRow, message: string) =>
        ctx.addIssue({ code: 'custom', message, path: ['actions', i, field] });
      const key = row.label.trim().toLowerCase();
      if (key === 'ordinary' || key === 'ordinary passage') {
        at('label', 'Ordinary passage is the majority threshold above.');
      } else if (key && labels.has(key)) {
        at('label', 'Another action type already has this name.');
      }
      labels.add(key);
      if (row.type === 'count') {
        if (!isWhole(row.needed, 1, 1000)) at('needed', 'Enter a whole number of at least 1.');
        else if (row.needed > v.bodySize) at('needed', 'Can’t be more than the body size.');
      }
      if (row.type === 'fraction') {
        if (!isWhole(row.denominator, 1, 100)) at('denominator', 'Use 1 to 100.');
        if (!isWhole(row.numerator, 1, 100)) at('numerator', 'Use 1 to 100.');
        else if (row.numerator > row.denominator)
          at('numerator', 'Can’t be more than the bottom number.');
      }
    });
  });
export type VoteRulesFormValues = z.infer<typeof voteRulesFormSchema>;

export function newActionRow(): ActionRow {
  return {
    id: '',
    label: '',
    type: 'count',
    needed: Number.NaN,
    numerator: 2,
    denominator: 3,
    of: 'seats',
    note: '',
    verified: true,
  };
}

function toRow(rule: ActionVoteRule): ActionRow {
  const row: ActionRow = {
    ...newActionRow(),
    id: rule.id,
    label: rule.label,
    note: rule.note,
    verified: rule.verified,
  };
  const t = rule.threshold;
  row.type = t.type;
  if (t.type === 'count') row.needed = t.needed;
  if (t.type === 'fraction')
    Object.assign(row, { numerator: t.numerator, denominator: t.denominator, of: t.of });
  return row;
}

export function toFormValues(
  rules: VoteRules | null,
  procedure: SavedVoteProcedure | null = rules,
): VoteRulesFormValues {
  return {
    bodySize: rules?.bodySize ?? Number.NaN,
    majorityThreshold: rules?.majorityThreshold ?? Number.NaN,
    quorum: rules?.quorum ?? Number.NaN,
    recusal: procedure?.recusal ?? 'excluded',
    tieBreak: procedure?.tieBreak ?? 'fails',
    actions: (procedure?.actions ?? []).map(toRow),
  };
}

function toThreshold(row: ActionRow): VoteThreshold {
  switch (row.type) {
    case 'count':
      return { type: 'count', needed: row.needed };
    case 'fraction':
      return {
        type: 'fraction',
        numerator: row.numerator,
        denominator: row.denominator,
        of: row.of,
      };
    case 'present_majority':
      return { type: 'present_majority' };
    case 'consent':
      return { type: 'consent' };
  }
}

const ACTION_ID_MAX = 40;

function fitId(base: string, suffix = ''): string {
  return `${base.slice(0, ACTION_ID_MAX - suffix.length).replace(/_+$/, '')}${suffix}`;
}

export function idFromLabel(label: string, taken: Set<string>): string {
  let base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!/^[a-z]/.test(base)) base = `action_${base}`.replace(/_+$/, '');
  if (base.length < 2 || base === 'ordinary') base = `${base}_rule`;
  let id = fitId(base);
  for (let n = 2; taken.has(id); n += 1) id = fitId(base, `_${String(n)}`);
  return id;
}

export function toVoteRules(values: VoteRulesFormValues): VoteRules {
  const taken = new Set(values.actions.map((row) => row.id).filter(Boolean));
  const actions = values.actions.map((row): ActionVoteRule => {
    let id = row.id;
    if (!id) {
      id = idFromLabel(row.label, taken);
      taken.add(id);
    }
    return {
      id,
      label: row.label.trim(),
      threshold: toThreshold(row),
      note: row.note.trim(),
      verified: row.verified,
    };
  });
  return {
    bodySize: values.bodySize,
    majorityThreshold: values.majorityThreshold,
    quorum: values.quorum,
    recusal: values.recusal,
    tieBreak: values.tieBreak,
    actions,
  };
}
