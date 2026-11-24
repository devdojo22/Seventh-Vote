import { plural } from '@/lib/plural';
import type { SessionAnalysis } from '@/types/simulation';
import { unreachableReason } from './thresholds';


const DIRECTION_COPY = {
  support: {
    leaning: 'leaning yes',
    met: 'Projected path to passage',
    short: 'Below the passage threshold',
    solid: 'solid yes',
    counter: 'solid no',
  },
  oppose: {
    leaning: 'leaning to oppose',
    met: 'Projected path to opposition',
    short: 'Below the opposition threshold',
    solid: 'solid opposition',
    counter: 'solid support',
  },
} as const;

export function outcomeHeadline(analysis: SessionAnalysis): string {
  const { outcome, direction, threshold, evidenceGap, voting } = analysis;
  if (outcome === 'unreachable') return unreachableReason(threshold, voting.length);
  if (evidenceGap.decisive) return 'Too close to call: not enough evidence';
  return outcome === 'met' ? DIRECTION_COPY[direction].met : DIRECTION_COPY[direction].short;
}

export function outcomeText(analysis: SessionAnalysis): string {
  const { outcome, goalCount, target, direction, breakdown, evidenceGap } = analysis;
  const copy = DIRECTION_COPY[direction];
  const margin = Math.abs(goalCount - target);
  const gap =
    outcome === 'met'
      ? `${margin} vote${plural(margin)} above threshold`
      : `${margin} more ${copy.leaning} vote${plural(margin)} needed`;
  const unplaced = evidenceGap.decisive
    ? ` · ${evidenceGap.members.length} undecided with no direct evidence`
    : '';
  return `${gap}${unplaced} · ${breakdown.solid} ${copy.solid} · ${breakdown.persuadable} persuadable · ${breakdown.counter} ${copy.counter}`;
}

export function evidenceGapNote(analysis: SessionAnalysis): { title: string; body: string } | null {
  const { members, decisive } = analysis.evidenceGap;
  if (members.length === 0) return null;
  const n = members.length;
  const who = `${n} present member${plural(n)} (${members.map((r) => r.member.name).join(', ')})`;
  if (decisive) {
    const counted =
      analysis.direction === 'oppose'
        ? { as: 'They don’t count toward the block here', not: 'predicted support' }
        : { as: 'They count as “not yes” here', not: 'predicted opposition' };
    return {
      title: 'Projection unreliable: not enough evidence',
      body: `${who} ${n === 1 ? 'has' : 'have'} no direct evidence on this item, so the simulation marked ${n === 1 ? 'them' : 'them all'} Undecided. ${counted.as}, and together they could decide the result. Treat this as missing information, not ${counted.not}: add evidence to their dossiers or check with them directly.`,
    };
  }
  return {
    title: `${n} member${plural(n)} with no direct evidence`,
    body: `${who} ${n === 1 ? 'has' : 'have'} no direct evidence on this item and ${n === 1 ? 'is' : 'are'} shown as Undecided. They don’t change the projected result.`,
  };
}

export function thresholdFigure(analysis: SessionAnalysis): { figure: string; caption: string } {
  const { threshold, direction, target, goalCount } = analysis;
  if (threshold.basis === 'consent') {
    return { figure: 'Any 1', caption: 'member may pull from consent' };
  }
  return {
    figure: `${goalCount} / ${threshold.denominator}`,
    caption: `${direction === 'oppose' ? 'leaning to oppose' : 'leaning yes'} · ${target} ${direction === 'oppose' ? 'to block' : 'needed'}`,
  };
}

function verificationText({ threshold, rule }: SessionAnalysis): string {
  if (threshold.verified) {
    return 'The threshold is recomputed from the selected action type and attendance.';
  }

  return rule.id === 'ordinary'
    ? `The ${threshold.needed}-vote ordinary-passage default is shown as an unverified working inference, not a confirmed Rules threshold.`
    : `The ${threshold.label} threshold for “${rule.label}” is not verified against the Rules, so treat it as a working inference.`;
}

export function thresholdExplanation(analysis: SessionAnalysis): string {
  const { threshold, direction, target } = analysis;
  const parts = [verificationText(analysis)];
  if (direction === 'oppose' && threshold.basis !== 'consent') {
    const { abstentions } = threshold;
    const cannotVoteYes =
      threshold.basis === 'full'
        ? '; absent and recused members cannot vote yes, so they count toward the block'
        : abstentions > 0
          ? `; ${abstentions} recused member${plural(abstentions)} counted as present cannot vote yes, so they count toward the block`
          : '';
    parts.push(`To block, ${target} members must not vote yes${cannotVoteYes}.`);
  }
  return parts.join(' ');
}

export function pivotalCopy(analysis: SessionAnalysis): {
  title: string;
  desc: string;
  goal: string;
  action: string;
} {
  const { pivot, direction, threshold } = analysis;
  const side = direction === 'oppose' ? 'opposition' : 'support';
  const goal =
    direction === 'oppose' ? `blocking target of ${pivot.target}` : `${threshold.label} threshold`;
  const action =
    pivot.mode === 'reach'
      ? `Persuade for vote ${pivot.target}`
      : 'Protect the projected coalition';

  if (pivot.mode === 'reach') {
    return {
      title: `One member can become vote ${pivot.target}`,
      desc: `The projection has ${pivot.goalCount} votes leaning to ${side}. Any member below can reach the ${goal} by moving to the requested side; priority ranks the most movable first.`,
      goal,
      action,
    };
  }
  if (pivot.mode === 'hold') {
    return {
      title: `The coalition is exactly at ${pivot.target}`,
      desc: `Every projected ${side} vote is pivotal: losing any one changes the outcome. Protect the most movable members first.`,
      goal,
      action,
    };
  }
  if (pivot.goalCount < pivot.target - 1) {
    return {
      title: 'No single member changes the outcome yet',
      desc: `The projection has ${pivot.goalCount} votes leaning to ${side}. It takes ${pivot.target - pivot.goalCount} additional shifts to reach ${pivot.target}, so pivotality is currently zero for every member.`,
      goal,
      action,
    };
  }
  const cushion = pivot.goalCount - pivot.target;
  const margin = cushion
    ? `; the margin is ${cushion} vote${plural(cushion)} above ${pivot.target}`
    : '';
  return {
    title: 'The projected coalition has a cushion',
    desc: `The projection has ${pivot.goalCount} votes leaning to ${side}. One member flipping would not reverse the outcome${margin}.`,
    goal,
    action,
  };
}

export function outreachNote(analysis: SessionAnalysis): string {
  if (analysis.outcome === 'consent') return 'Highest objection risk';
  return analysis.pivot.candidates.length
    ? 'Movability × pivotality'
    : 'Movability; no single-member pivot';
}
