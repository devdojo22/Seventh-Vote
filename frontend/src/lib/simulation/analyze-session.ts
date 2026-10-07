import { ASK_DIRECTIONS } from '@/data/agenda';
import type { Member } from '@/types/member';
import type { ActionRule, SessionAnalysis, SessionInput, SessionOutcome } from '@/types/simulation';
import {
  blocRow,
  consentObjectors,
  goalCount,
  lobbyRanking,
  pivotalAnalysis,
  sortRows,
  tallySegments,
  votingRows,
} from './pivotal';
import { scoreMember } from './scoring';
import { goalTarget, thresholdFor } from './thresholds';

interface AnalyzeArgs {
  members: Member[];
  input: SessionInput;
  rule: ActionRule;
  seatCount: number;
}

/** Everything a session result shows, computed once from the form input. */
export function analyzeSession({ members, input, rule, seatCount }: AnalyzeArgs): SessionAnalysis {
  const rows = sortRows(members.map((m) => scoreMember(m, input)));
  const voting = votingRows(rows);
  const direction = ASK_DIRECTIONS[input.ask];
  const threshold = thresholdFor(rule, voting.length, seatCount);
  const target = goalTarget(threshold, direction);
  const count = goalCount(rows, direction, threshold);
  const pivot = pivotalAnalysis(rows, direction, threshold, target);

  let outcome: SessionOutcome = count >= target ? 'met' : 'short';
  if (threshold.basis === 'consent') outcome = 'consent';
  if (!voting.length || !threshold.reachable) outcome = 'unreachable';

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
    blocRow: blocRow(rows),
  };
}
