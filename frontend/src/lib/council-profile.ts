import { councilConfig, MEMPHIS_SNAPSHOT_MEMBER_SLUGS } from '@/data/council';
import { SESSION_DEFAULTS } from '@/data/session-defaults';
import { ORDINARY_INFERENCE_NOTE, PROCEDURAL_RULES } from '@/data/voting-rules';
import type { ActionVoteRule, VoteRules } from '@/features/access/access-api';
import { DEFAULT_PROCEDURE, fractionOf } from '@/lib/simulation/thresholds';
import type { CouncilConfig } from '@/types/council';
import type { Member } from '@/types/member';
import type { ActionRule, SessionInput, VoteProcedure } from '@/types/simulation';

export type SessionDefaults = Omit<SessionInput, 'districts' | 'attendance'>;

export interface CouncilProfile {
  config: CouncilConfig;
  rules: ActionRule[];
  procedure: VoteProcedure;
  sessionDefaults: SessionDefaults;
  snapshot: boolean;
}

type SavedVoteRules = Pick<
  VoteRules,
  'bodySize' | 'majorityThreshold' | 'actions' | 'recusal' | 'tieBreak'
>;

export interface WorkspaceInfo {
  name: string;
  voteRules: SavedVoteRules | null;
}

const SNAPSHOT_MEMBER_IDS = new Set(MEMPHIS_SNAPSHOT_MEMBER_SLUGS);

export function holdsSnapshot(members: Member[]): boolean {
  return members.some((m) => SNAPSHOT_MEMBER_IDS.has(m.id));
}

const NEUTRAL_SESSION_DEFAULTS: SessionDefaults = {
  title: '',
  desc: '',
  category: SESSION_DEFAULTS.category,
  ask: 'Approval',
  actionType: 'ordinary',
  fiscal: 'neutral',
  impact: 'citywide',
  priority: 'no',
  committee: '',
  committeeChair: '',
};

const ORDINARY = {
  id: 'ordinary',
  label: 'Ordinary ordinance or resolution',
  basis: 'full',
} as const;

function inferredOrdinaryRule(seatCount: number, note: string): ActionRule {
  return { ...ORDINARY, needed: Math.floor(seatCount / 2) + 1, verified: false, note };
}

export function toActionRule(action: ActionVoteRule, seatCount: number): ActionRule {
  const base = { id: action.id, label: action.label, verified: action.verified, note: action.note };
  const { threshold } = action;
  switch (threshold.type) {
    case 'count':
      return { ...base, basis: 'full', needed: threshold.needed };
    case 'fraction':
      return threshold.of === 'seats'
        ? {
            ...base,
            basis: 'full',
            needed: fractionOf(seatCount, threshold.numerator, threshold.denominator),
          }
        : {
            ...base,
            basis: 'present',
            fraction: { numerator: threshold.numerator, denominator: threshold.denominator },
          };
    case 'present_majority':
      return { ...base, basis: 'present' };
    case 'consent':
      return { ...base, basis: 'consent' };
  }
}


function savedRules(seatCount: number, voteRules: SavedVoteRules): ActionRule[] {
  return [
    {
      ...ORDINARY,
      needed: voteRules.majorityThreshold,
      verified: true,
      note: 'From this workspace’s vote rules',
    },
    ...voteRules.actions.map((action) => toActionRule(action, seatCount)),
  ];
}

function inferredRules(seatCount: number, snapshot: boolean): ActionRule[] {
  if (snapshot)
    return [inferredOrdinaryRule(seatCount, ORDINARY_INFERENCE_NOTE), ...PROCEDURAL_RULES];
  return [
    inferredOrdinaryRule(
      seatCount,
      'Working inference only · a majority of seats until this workspace’s vote rules are set',
    ),
    {
      id: 'defer_drop',
      label: 'Defer or drop item',
      basis: 'present',
      verified: false,
      note: 'Working inference only · majority of members present',
    },
    {
      id: 'consent',
      label: 'Consent-routed item',
      basis: 'consent',
      verified: false,
      note: 'Working inference only · one objection removes the item from consent',
    },
  ];
}

function neutralConfig(seatCount: number, workspace: WorkspaceInfo): CouncilConfig {
  return {
    councilName: workspace.name,
    seatCount,
    termLabel: '',
    snapshotLabel: 'Workspace dossiers',
    snapshotNote: 'Runs against this workspace’s dossiers.',
    rulesOfProcedure: null,
    leadershipFallback: null,
    procedure: {
      oneShotStakes: null,
      committeeReferralHint: '',
      committeeChairHint: '',
      attendanceNote:
        'Absent and recused members are excluded from “majority present” math. Full-membership thresholds stay fixed.',
      consentNote:
        'Any one member may pull an item from consent for normal handling. Focus on objection risk, not a passage count.',
    },
    research: { sourceCaveats: [], knownLimitations: '' },
  };
}

export function councilProfile(members: Member[], workspace: WorkspaceInfo): CouncilProfile {
  const { voteRules } = workspace;
  const seatCount = voteRules?.bodySize ?? members.length;
  const snapshot = holdsSnapshot(members);
  return {
    config: snapshot ? { ...councilConfig, seatCount } : neutralConfig(seatCount, workspace),
    rules: voteRules ? savedRules(seatCount, voteRules) : inferredRules(seatCount, snapshot),
    procedure: voteRules
      ? { recusal: voteRules.recusal, tieBreak: voteRules.tieBreak }
      : DEFAULT_PROCEDURE,
    sessionDefaults: snapshot ? SESSION_DEFAULTS : NEUTRAL_SESSION_DEFAULTS,
    snapshot,
  };
}
