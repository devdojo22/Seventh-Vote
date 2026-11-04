import type {
  DatePrecision,
  EvidenceKind,
  RecordOutcome,
  RecordType,
  ReviewStatus,
  StanceLabelValue,
} from '@/types/dossier';

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  approved: 'Approved',
};

export const REVIEW_STATUS_DESCRIPTIONS: Record<ReviewStatus, string> = {
  draft: 'Being written or researched. Not checked yet.',
  in_review: 'Ready for someone to check the content and its sources.',
  approved: 'Content and sources have been checked.',
};

export const REVIEW_STATUS_CLASSES: Record<ReviewStatus, string> = {
  draft: 'border border-line bg-paper text-muted',
  in_review: 'bg-steel-bg text-steel',
  approved: 'bg-pine-bg text-pine',
};

export const REVIEW_STATUS_DOTS: Record<ReviewStatus, string> = {
  draft: 'bg-muted/60',
  in_review: 'bg-steel',
  approved: 'bg-pine',
};

export const REVIEW_STATUS_STEPS: Record<ReviewStatus, { step: number; label: string }> = {
  draft: { step: 1, label: 'Drafting' },
  in_review: { step: 2, label: 'Reviewing' },
  approved: { step: 3, label: 'Approved' },
};

export const REVIEW_STATUS_CAPTIONS: Record<ReviewStatus, string> = {
  draft: 'Being written or sourced',
  in_review: 'Awaiting a reviewer’s sign-off',
  approved: 'Content and sources checked',
};

export const STANCE_LABEL_LABELS: Record<StanceLabelValue, string> = {
  support: 'Support',
  lean_support: 'Lean support',
  neutral: 'Neutral',
  lean_oppose: 'Lean oppose',
  oppose: 'Oppose',
  unknown: 'Unknown',
};

export const STANCE_LABEL_CLASSES: Record<StanceLabelValue, string> = {
  support: 'bg-pine text-white',
  lean_support: 'bg-pine-bg text-pine',
  neutral: 'border border-line bg-paper text-navy/70',
  lean_oppose: 'bg-brick-bg text-brick',
  oppose: 'bg-brick text-white',
  unknown: 'border border-line bg-paper text-muted',
};

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  vote: 'Vote',
  statement: 'Statement',
  sponsorship: 'Sponsorship',
  committee_action: 'Committee action',
  other: 'Other',
};

export const RECORD_OUTCOME_LABELS: Record<RecordOutcome, string> = {
  yes: 'Yes',
  no: 'No',
  abstain: 'Abstain',
  support_signal: 'Support signal',
  none: 'No outcome',
};

export const DATE_PRECISION_LABELS: Record<DatePrecision, string> = {
  day: 'Exact day',
  month: 'Month only',
  year: 'Year only',
  unknown: 'Unknown',
};

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  issue_position: 'Issue positions',
  key_record: 'Key record',
  quote: 'Quotes',
  mayor_alignment: 'Mayor alignment',
  voice_example: 'Voice example',
};
