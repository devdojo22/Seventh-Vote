import type { Workspace } from '@prisma/client';
import type { VoteRules } from '../../shared/types/api.types.js';

export function voteRulesOf(
  workspace: Pick<Workspace, 'voteBodySize' | 'voteMajorityThreshold' | 'voteQuorum'>,
): VoteRules | null {
  const { voteBodySize, voteMajorityThreshold, voteQuorum } = workspace;
  if (voteBodySize === null || voteMajorityThreshold === null || voteQuorum === null) return null;
  return { bodySize: voteBodySize, majorityThreshold: voteMajorityThreshold, quorum: voteQuorum };
}
