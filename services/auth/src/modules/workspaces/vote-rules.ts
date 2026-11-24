import type { Prisma, Workspace } from '@prisma/client';
import { z } from 'zod';
import {
  RECUSAL_MODES,
  TIE_BREAKS,
  type ActionVoteRule,
  type VoteProcedure,
  type VoteRules,
} from '../../shared/types/api.types.js';
import type { VoteRulesUpdate } from './workspace.repository.js';
import { actionVoteRuleSchema, type VoteRulesInput } from './workspace.validation.js';

export type VoteColumns = Pick<
  Workspace,
  'voteBodySize' | 'voteMajorityThreshold' | 'voteQuorum' | 'voteActions' | 'voteRecusal' | 'voteTieBreak'
>;

const storedRecusalSchema = z.enum(RECUSAL_MODES).catch('excluded');
const storedTieBreakSchema = z.enum(TIE_BREAKS).catch('fails');


export function voteProcedureOf(workspace: VoteColumns): VoteProcedure {
  const stored: unknown[] = Array.isArray(workspace.voteActions) ? workspace.voteActions : [];
  const actions = stored.flatMap((raw) => {
    const parsed = actionVoteRuleSchema.safeParse(raw);
    return parsed.success ? [parsed.data] : [];
  });
  return {
    actions,
    recusal: storedRecusalSchema.parse(workspace.voteRecusal),
    tieBreak: storedTieBreakSchema.parse(workspace.voteTieBreak),
  };
}

export function voteRulesOf(workspace: VoteColumns): VoteRules | null {
  const { voteBodySize, voteMajorityThreshold, voteQuorum } = workspace;
  if (voteBodySize === null || voteMajorityThreshold === null || voteQuorum === null) return null;
  return {
    bodySize: voteBodySize,
    majorityThreshold: voteMajorityThreshold,
    quorum: voteQuorum,
    ...voteProcedureOf(workspace),
  };
}

export function mergeVoteRules(input: VoteRulesInput, workspace: VoteColumns): VoteRules {
  const saved = voteProcedureOf(workspace);
  return {
    bodySize: input.bodySize,
    majorityThreshold: input.majorityThreshold,
    quorum: input.quorum,
    actions: input.actions ?? saved.actions,
    recusal: input.recusal ?? saved.recusal,
    tieBreak: input.tieBreak ?? saved.tieBreak,
  };
}

function seatsNeeded(rule: ActionVoteRule): number | null {
  return rule.threshold.type === 'count' ? rule.threshold.needed : null;
}

export function voteRulesProblems(rules: VoteRules): string[] {
  return rules.actions.flatMap((rule) => {
    const needed = seatsNeeded(rule);
    return needed !== null && needed > rules.bodySize
      ? [`${rule.label} needs ${String(needed)} votes but the body has only ${String(rules.bodySize)} seats`]
      : [];
  });
}

function toJson(rule: ActionVoteRule): Prisma.InputJsonObject {
  return {
    id: rule.id,
    label: rule.label,
    threshold: { ...rule.threshold },
    note: rule.note,
    verified: rule.verified,
  };
}

export function toVoteRulesUpdate(rules: VoteRules): VoteRulesUpdate {
  return {
    voteBodySize: rules.bodySize,
    voteMajorityThreshold: rules.majorityThreshold,
    voteQuorum: rules.quorum,
    voteActions: rules.actions.map(toJson),
    voteRecusal: rules.recusal,
    voteTieBreak: rules.tieBreak,
  };
}
