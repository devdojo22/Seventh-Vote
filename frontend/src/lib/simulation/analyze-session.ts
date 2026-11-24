import { ASK_DIRECTIONS } from '@/data/agenda';
import type {
  ActionRule,
  MemberRow,
  SessionAnalysis,
  SessionInput,
  SessionOutcome,
  VoteProcedure,
} from '@/types/simulation';
import {
  consentObjectors,
  goalCount,
  lobbyRanking,
  pivotalAnalysis,
  sortRows,
  tallySegments,
  votingRows,
} from './pivotal';
import { hasNoDirectEvidence } from './member-rows';
import { goalTarget, thresholdFor } from './thresholds';

interface AnalyzeArgs {
  rows: MemberRow[];
  input: SessionInput;
  rule: ActionRule;
  seatCount: number;
  procedure?: VoteProcedure;
}

export function analyzeSession({
  rows: unsorted,
  input,
  rule,
  seatCount,
  procedure,
}: AnalyzeArgs): SessionAnalysis {
  const rows = sortRows(unsorted);
  const voting = votingRows(rows);
  const direction = ASK_DIRECTIONS[input.ask];
  const recused = rows.filter((r) => r.participation === 'recused').length;
  const threshold = thresholdFor(rule, voting.length, seatCount, { recused, procedure });
  const target = goalTarget(threshold, direction);
  const count = goalCount(rows, direction, threshold);
  const pivot = pivotalAnalysis(rows, direction, threshold, target);

  let outcome: SessionOutcome = count >= target ? 'met' : 'short';
  if (threshold.basis === 'consent') outcome = 'consent';
  if (!voting.length || !threshold.reachable) outcome = 'unreachable';

  const unplaced = voting.filter(hasNoDirectEvidence);
  const evidenceGap = {
    members: unplaced,
    decisive: outcome === 'short' && count + unplaced.length >= target,
  };

  const tally = tallySegments(rows);
  const countOf = (label: string) => tally.find((s) => s.key === label)?.count ?? 0;
  const [solidLabel, counterLabel] =
    direction === 'oppose'
      ? ['Strong Oppose', 'Strong Support']
      : ['Strong Support', 'Strong Oppose'];
  const persuadable = countOf('Lean Oppose') + countOf('Undecided') + countOf('Lean Support');

  return {
    rule,
    rows,
    voting,
    notVoting: rows.length - voting.length,
    threshold,
    direction,
    target,
    goalCount: count,
    outcome,
    tally,
    breakdown: { solid: countOf(solidLabel), persuadable, counter: countOf(counterLabel) },
    pivot,
    lobby: lobbyRanking(rows, direction, pivot),
    consentObjectors: consentObjectors(rows),
    evidenceGap,
  };
}
