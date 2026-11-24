import type { RecusalMode, TieBreak } from '@/features/access/access-api';
import type { SimulationAnswer } from '@/features/simulation/simulation-api';
import type { Member, MemberId } from './member';

export const CATEGORY_IDS = [
  'budget_taxes',
  'economic_development_pilots',
  'public_safety',
  'mlgw_utilities',
  'housing',
  'transit_infrastructure',
  'neighborhoods_services',
  'education_youth',
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const ASKS = [
  'Approval',
  'Funding',
  'Ordinance change',
  'Resolution of support',
  'Oppose',
] as const;
export type Ask = (typeof ASKS)[number];

export type ActionType = string;

export const FISCAL_IMPACTS = ['cost', 'neutral', 'revenue'] as const;
export type FiscalImpact = (typeof FISCAL_IMPACTS)[number];

export const DISTRICT_IMPACTS = ['citywide', 'specific', 'super'] as const;
export type DistrictImpact = (typeof DISTRICT_IMPACTS)[number];

export const PRIORITIES = ['yes', 'no'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ATTENDANCE_STATUSES = ['present', 'absent', 'recused'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type StanceScore = -2 | -1 | 0 | 1 | 2;
export const STANCE_LABELS = [
  'Strong Oppose',
  'Lean Oppose',
  'Undecided',
  'Lean Support',
  'Strong Support',
] as const;
export type StanceLabel = (typeof STANCE_LABELS)[number];

export const CONFIDENCES = ['High', 'Medium', 'Low'] as const;
export type Confidence = (typeof CONFIDENCES)[number];

export const SIMULATION_RUN_STATUSES = ['running', 'done', 'failed'] as const;
export type SimulationRunStatus = (typeof SIMULATION_RUN_STATUSES)[number];

export const EVIDENCE_PIECE_KINDS = [
  'key_record',
  'quote',
  'issue_position',
  'profile',
  'political_style',
  'voting_bloc',
] as const;
export type EvidencePieceKind = (typeof EVIDENCE_PIECE_KINDS)[number];

export type Direction = 'support' | 'oppose';

export interface SessionInput {
  title: string;
  desc: string;
  category: CategoryId;
  actionType: ActionType;
  committee: string;
  committeeChair: string;
  fiscal: FiscalImpact;
  ask: Ask;
  impact: DistrictImpact;
  priority: Priority;
  districts: string[];
  attendance: Record<MemberId, AttendanceStatus>;
}

export type MemberRow = {
  member: Member;
} & (
  | {
      participation: 'present';
      stance: StanceLabel;
      score: StanceScore;
      confidence: Confidence;
      answer: SimulationAnswer;
    }
  | {
      participation: Exclude<AttendanceStatus, 'present'>;
      stance: null;
      score: 0;
      confidence: null;
      answer: null;
    }
);

export type PresentMemberRow = Extract<MemberRow, { participation: 'present' }>;

export interface Threshold {
  ruleId: ActionType;
  basis: 'full' | 'present' | 'consent';
  verified: boolean;
  needed: number;
  denominator: number;
  reachable: boolean;
  label: string;
  note: string;
  abstentions: number;
}

export interface VoteProcedure {
  recusal: RecusalMode;
  tieBreak: TieBreak;
}

export type PivotalMode = 'reach' | 'hold' | 'none';

export interface PivotalCandidate {
  row: PresentMemberRow;
  priority: number;
}

export interface PivotalAnalysis {
  goalCount: number;
  target: number;
  mode: PivotalMode;
  candidates: PivotalCandidate[];
}

export type SessionOutcome = 'met' | 'short' | 'consent' | 'unreachable';

export interface TallySegment {
  key: string;
  label: string;
  count: number;
  widthPct: number;
  barClass: string;
}

export interface SessionAnalysis {
  rule: ActionRule;
  rows: MemberRow[];
  voting: PresentMemberRow[];
  notVoting: number;
  threshold: Threshold;
  direction: Direction;
  target: number;
  goalCount: number;
  outcome: SessionOutcome;
  tally: TallySegment[];
  breakdown: { solid: number; persuadable: number; counter: number };
  pivot: PivotalAnalysis;
  lobby: PresentMemberRow[];
  consentObjectors: PresentMemberRow[];
  evidenceGap: EvidenceGap;
}

export interface EvidenceGap {
  members: PresentMemberRow[];
  /** These members alone could reverse the projected result, so it should not be relied on. */
  decisive: boolean;
}

export interface Citation {
  id: string;
  name: string;
  url: string;
  label: string;
}

interface RuleBase {
  id: ActionType;
  label: string;
  verified: boolean;
  note: string;
}

export interface PresentFraction {
  numerator: number;
  denominator: number;
}

export type ActionRule = RuleBase &
  (
    | { basis: 'full'; needed: number }
    | { basis: 'present'; fraction?: PresentFraction }
    | { basis: 'consent' }
  );

export interface StanceDefinition {
  score: StanceScore;
  label: StanceLabel;
  pillClass: string;
  barClass: string;
}
