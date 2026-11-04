import { councilConfig } from '@/data/council';
import { rehearsalRules } from '@/data/rehearsal-rules';
import { SESSION_DEFAULTS } from '@/data/session-defaults';
import { ORDINARY_INFERENCE_NOTE, PROCEDURAL_RULES } from '@/data/voting-rules';
import type { CouncilConfig } from '@/types/council';
import type { Member } from '@/types/member';
import type { ActionRule, RehearsalRules, SessionInput } from '@/types/simulation';

export type SessionDefaults = Omit<SessionInput, 'districts' | 'attendance'>;

export interface CouncilProfile {
  config: CouncilConfig;
  rules: ActionRule[];
  sessionDefaults: SessionDefaults;
  snapshot: boolean;
}

export interface WorkspaceInfo {
  name: string;
  voteRules: { bodySize: number; majorityThreshold: number } | null;
}

function snapshotMemberIds(rules: RehearsalRules): Set<string> {
  return new Set([
    rules.moratorium.leadSponsorId,
    ...rules.moratorium.sponsorIds,
    rules.loganMoratorium.memberId,
    ...rules.noDirectVoiceMemberIds,
    ...rules.thinRecordMemberIds,
    rules.blocWatch.memberId,
  ]);
}

const SNAPSHOT_MEMBER_IDS = snapshotMemberIds(rehearsalRules);

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

function ordinaryRule(
  seatCount: number,
  voteRules: WorkspaceInfo['voteRules'],
  inferenceNote: string,
): ActionRule {
  return {
    id: 'ordinary',
    label: 'Ordinary ordinance or resolution',
    basis: 'full',
    needed: voteRules?.majorityThreshold ?? Math.floor(seatCount / 2) + 1,
    verified: voteRules !== null,
    note: voteRules ? 'From this workspace’s vote rules' : inferenceNote,
  };
}

function neutralRules(seatCount: number, voteRules: WorkspaceInfo['voteRules']): ActionRule[] {
  return [
    ordinaryRule(
      seatCount,
      voteRules,
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
  if (holdsSnapshot(members)) {
    return {
      config: { ...councilConfig, seatCount },
      rules: [ordinaryRule(seatCount, voteRules, ORDINARY_INFERENCE_NOTE), ...PROCEDURAL_RULES],
      sessionDefaults: SESSION_DEFAULTS,
      snapshot: true,
    };
  }
  return {
    config: neutralConfig(seatCount, workspace),
    rules: neutralRules(seatCount, voteRules),
    sessionDefaults: NEUTRAL_SESSION_DEFAULTS,
    snapshot: false,
  };
}
