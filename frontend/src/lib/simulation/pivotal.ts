import { rehearsalRules } from '@/data/rehearsal-rules';
import { STANCES } from '@/data/stances';
import { alignment, recordDepth } from '@/lib/members';
import type {
  Direction,
  MemberRow,
  PivotalAnalysis,
  PivotalMode,
  TallySegment,
  Threshold,
} from '@/types/simulation';

/** Base movability by distance from the requested side (0 = undecided). */
const MOVABILITY_BASE = { undecided: 100, lean: 72, firm: 35 } as const;
const CONFIDENCE_FACTOR = { High: 0.78, Medium: 0.9, Low: 1 } as const;
const RECORD_DEPTH_FACTOR = { Thin: 1.12, Moderate: 1.06, Strong: 0.94 } as const;
const MAYOR_POSTURE_FACTOR = { ally: 1.05, independent: 1, critic: 0.9 } as const;

const OUTREACH_LIMIT = 3;

/** Members counted in the projection; absent and recused members are excluded. */
export function votingRows(rows: MemberRow[]): MemberRow[] {
  return rows.filter((r) => r.participation === 'present');
}

/** Score oriented toward the requested side: positive means leaning that way. */
function goalScore(row: MemberRow, direction: Direction): number {
  return direction === 'oppose' ? -row.score : row.score;
}

/**
 * Votes already on the requested side. When blocking a full-membership vote,
 * absent and recused members cannot vote yes, so they count toward the block.
 */
export function goalCount(rows: MemberRow[], direction: Direction, threshold: Threshold): number {
  const voting = votingRows(rows);
  const leaning = voting.filter((r) => goalScore(r, direction) > 0).length;
  const cannotVoteYes =
    direction === 'oppose' && threshold.basis === 'full' ? rows.length - voting.length : 0;
  return leaning + cannotVoteYes;
}

/**
 * Movability 0–100: higher for undecided or leaning stances, lower-confidence or
 * thinner records, and cooperative mayor relationships. A prioritization aid,
 * not a probability.
 */
export function movability(row: MemberRow, direction: Direction): number {
  const distance = Math.abs(goalScore(row, direction));
  const base =
    distance === 0
      ? MOVABILITY_BASE.undecided
      : distance === 1
        ? MOVABILITY_BASE.lean
        : MOVABILITY_BASE.firm;
  const factor =
    CONFIDENCE_FACTOR[row.confidence] *
    RECORD_DEPTH_FACTOR[recordDepth(row.member).label] *
    MAYOR_POSTURE_FACTOR[alignment(row.member)];
  return Math.min(100, Math.round(base * factor));
}

/** Tie-break weight for chairs and emeritus leadership. */
function influence(row: MemberRow): number {
  const roles = `${row.member.leadership_role} ${Object.values(row.member.committees).join(' ')}`;
  return /chair|emeritus/i.test(roles) ? 2 : 0;
}

/**
 * One-member threshold test: "reach" when the requested side is exactly one
 * vote short, "hold" when it is exactly at the target, else "none".
 * Consent items and unreachable thresholds have no pivotal members.
 */
export function pivotalAnalysis(
  rows: MemberRow[],
  direction: Direction,
  threshold: Threshold,
  target: number,
): PivotalAnalysis {
  const count = goalCount(rows, direction, threshold);
  if (threshold.basis === 'consent' || !threshold.reachable) {
    return { goalCount: count, target, mode: 'none', candidates: [] };
  }
  const mode: PivotalMode = count === target - 1 ? 'reach' : count === target ? 'hold' : 'none';
  const voting = votingRows(rows);
  const pool =
    mode === 'reach'
      ? voting.filter((r) => goalScore(r, direction) <= 0)
      : mode === 'hold'
        ? voting.filter((r) => goalScore(r, direction) > 0)
        : [];
  const candidates = pool
    .map((row) => ({ row, priority: movability(row, direction) }))
    .sort((a, b) => b.priority - a.priority || influence(b.row) - influence(a.row));
  return { goalCount: count, target, mode, candidates };
}

export function blocRow(rows: MemberRow[]): MemberRow | undefined {
  const { memberId, votingBlocPattern } = rehearsalRules.blocWatch;
  return rows.find(
    (r) =>
      r.member.id === memberId &&
      r.participation === 'present' &&
      votingBlocPattern.test(r.member.voting_bloc),
  );
}

/** Present members first, then strongest support to strongest opposition. */
export function sortRows(rows: MemberRow[]): MemberRow[] {
  return [...rows].sort(
    (a, b) =>
      Number(a.participation !== 'present') - Number(b.participation !== 'present') ||
      b.score - a.score,
  );
}

/** Top outreach ranking for "First three conversations". */
export function lobbyRanking(
  rows: MemberRow[],
  direction: Direction,
  pivot: PivotalAnalysis,
): MemberRow[] {
  const pool = pivot.candidates.length
    ? pivot.candidates.map((c) => c.row)
    : votingRows(rows).filter((r) => Math.abs(r.score) <= 1);
  return [...pool]
    .sort(
      (a, b) => movability(b, direction) - movability(a, direction) || influence(b) - influence(a),
    )
    .slice(0, OUTREACH_LIMIT);
}

/** Members most likely to pull a consent item, riskiest first. */
export function consentObjectors(rows: MemberRow[]): MemberRow[] {
  return votingRows(rows)
    .filter((r) => r.score <= 0)
    .sort((a, b) => a.score - b.score || movability(b, 'support') - movability(a, 'support'));
}

/** Stance segments plus the not-voting segment, as shares of all seats so the bar never overflows. */
export function tallySegments(rows: MemberRow[]): TallySegment[] {
  const voting = votingRows(rows);
  const share = (count: number) => (rows.length ? (count / rows.length) * 100 : 0);
  const segments: TallySegment[] = STANCES.map((stance) => {
    const count = voting.filter((r) => r.stance === stance.label).length;
    return {
      key: stance.label,
      label: stance.label,
      count,
      widthPct: share(count),
      barClass: stance.barClass,
    };
  });
  const notVoting = rows.length - voting.length;
  if (notVoting > 0) {
    segments.push({
      key: 'not-voting',
      label: 'Absent / recused',
      count: notVoting,
      widthPct: share(notVoting),
      barClass: 'bg-navy/20',
    });
  }
  return segments;
}
