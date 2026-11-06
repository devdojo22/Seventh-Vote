/** Value sets of the dossier API (services/api/council). Labels live in `@/data/dossier-options`. */

/** Review status of one dossier version. */
export const REVIEW_STATUSES = ['draft', 'in_review', 'approved'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** What an entry in a dossier's archive history records. */
export const ARCHIVE_ACTIONS = ['archived', 'restored'] as const;
export type ArchiveAction = (typeof ARCHIVE_ACTIONS)[number];

/** Nullable on an issue position until the client confirms the label set. */
export const STANCE_LABELS = [
  'support',
  'lean_support',
  'neutral',
  'lean_oppose',
  'oppose',
  'unknown',
] as const;
export type StanceLabelValue = (typeof STANCE_LABELS)[number];

export const RECORD_TYPES = [
  'vote',
  'statement',
  'sponsorship',
  'committee_action',
  'other',
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const RECORD_OUTCOMES = ['yes', 'no', 'abstain', 'support_signal', 'none'] as const;
export type RecordOutcome = (typeof RECORD_OUTCOMES)[number];

export const DATE_PRECISIONS = ['day', 'month', 'year', 'unknown'] as const;
export type DatePrecision = (typeof DATE_PRECISIONS)[number];

/**
 * Input size limits of the dossier API (services/api/council/serializers.py and the model column lengths).
 * Mirrors the backend so the form flags oversize input before saving: change both together.
 */
export const DOSSIER_LIMITS = {
  name: 200,
  initials: 10,
  district: 100,
  tookOffice: 200,
  shortLabel: 200, // political archetype, committee, role, issue topic, mayor relationship
  year: 50,
  sourceName: 300,
  sourceUrl: 2000,
  recordTitle: 1000,
  context: 1000,
  dateText: 100,
  longText: 10_000, // biography, political style, voice description, voting bloc, mayor example
  paragraph: 5_000, // leadership role, stance, evidence, key-record description, quotes
  itemText: 2_000, // one opposition trigger, persuasion lever or data gap
  changeNote: 500,
  keyRecords: 100,
  quotes: 50,
  list: 30, // committees, issue positions, triggers, levers, data gaps
} as const;

export const EVIDENCE_KINDS = [
  'issue_position',
  'key_record',
  'quote',
  'mayor_alignment',
  'voice_example',
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
