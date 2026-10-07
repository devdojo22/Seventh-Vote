import type { IssuePosition, KeyVote, Member, MemberId } from './member';

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

export const ACTION_TYPES = [
  'ordinary',
  'censure',
  'rules_amendment',
  'appeal_chair',
  'defer_drop',
  'order_business',
  'consent',
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const FISCAL_IMPACTS = ['cost', 'neutral', 'revenue'] as const;
export type FiscalImpact = (typeof FISCAL_IMPACTS)[number];

export const DISTRICT_IMPACTS = ['citywide', 'specific', 'super'] as const;
export type DistrictImpact = (typeof DISTRICT_IMPACTS)[number];

export const PRIORITIES = ['yes', 'no'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ATTENDANCE_STATUSES = ['present', 'absent', 'recused'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type StanceScore = -2 | -1 | 0 | 1 | 2;
export type StanceLabel =
  'Strong Oppose' | 'Lean Oppose' | 'Undecided' | 'Lean Support' | 'Strong Support';

export type Confidence = 'High' | 'Medium' | 'Low';

/** Which side of the vote the user wants: to pass the item or to block it. */
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

export interface Evidence {
  category: CategoryId;
  position: IssuePosition | null;
  votes: KeyVote[];
  count: number;
}

export interface MemberRow {
  member: Member;
  score: StanceScore;
  stance: StanceLabel;
  confidence: Confidence;
  participation: AttendanceStatus;
  /** Simulated reasoning in rehearsal language, never a quote. */
  reason: string;
  concerns: string[];
  levers: string[];
  evidence: Evidence;
}

export interface Threshold {
  ruleId: ActionType;
  basis: 'full' | 'present' | 'consent';
  /** False when the rule is a working inference rather than a confirmed rule. */
  verified: boolean;
  /** Votes needed to pass. */
  needed: number;
  denominator: number;
  /** False when nobody can vote under this rule (zero present on a present-majority rule). */
  reachable: boolean;
  label: string;
  note: string;
}

export type PivotalMode = 'reach' | 'hold' | 'none';

export interface PivotalCandidate {
  row: MemberRow;
  /** 0–100 movability score. */
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
  voting: MemberRow[];
  notVoting: number;
  threshold: Threshold;
  direction: Direction;
  /** Goal-side votes needed: to pass, or to block. */
  target: number;
  goalCount: number;
  outcome: SessionOutcome;
  tally: TallySegment[];
  breakdown: { solid: number; persuadable: number; counter: number };
  pivot: PivotalAnalysis;
  lobby: MemberRow[];
  consentObjectors: MemberRow[];
  blocRow: MemberRow | undefined;
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
  /** False when the threshold is a working inference rather than a confirmed rule. */
  verified: boolean;
  note: string;
}

/** Passage rule for one procedural action. 'present' rules need a majority of members present. */
export type ActionRule = RuleBase &
  ({ basis: 'full'; needed: number } | { basis: 'present' } | { basis: 'consent' });

export interface StanceDefinition {
  score: StanceScore;
  label: StanceLabel;
  pillClass: string;
  barClass: string;
}

export interface RehearsalRules {
  moratorium: {
    leadSponsorId: MemberId;
    sponsorIds: readonly MemberId[];
    sponsorReasons: {
      lead: { support: string; oppose: string };
      cosponsor: { support: string; oppose: string };
    };
  };
  loganMoratorium: {
    memberId: MemberId;
    voteDate: string;
    positionPattern: RegExp;
    reasons: { support: string; oppose: string };
  };
  /** Members with no verified verbatim quotes: the engine must not invent a direct voice. */
  noDirectVoiceMemberIds: readonly MemberId[];
  /** Members whose public record is thinner than their dossier size suggests. */
  thinRecordMemberIds: readonly MemberId[];
  blocWatch: { memberId: MemberId; votingBlocPattern: RegExp };
}
