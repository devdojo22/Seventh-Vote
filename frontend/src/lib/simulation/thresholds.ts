import { plural } from '@/lib/plural';
import type { ActionRule, Direction, Threshold, VoteProcedure } from '@/types/simulation';

/** The procedure every workspace had before vote rules were saved (the auth service's column defaults). */
export const DEFAULT_PROCEDURE: VoteProcedure = { recusal: 'excluded', tieBreak: 'fails' };

/** At least numerator/denominator of `count`, never less than 1. */
export function fractionOf(count: number, numerator: number, denominator: number): number {
  return Math.max(1, Math.ceil((count * numerator) / denominator));
}

interface ThresholdOptions {
  recused?: number;
  procedure?: VoteProcedure;
}

function presentMajority(present: number, tieBreak: VoteProcedure['tieBreak']): number {
  return tieBreak === 'passes' ? Math.max(1, Math.ceil(present / 2)) : Math.floor(present / 2) + 1;
}

export function thresholdFor(
  rule: ActionRule,
  presentCount: number,
  seatCount: number,
  { recused = 0, procedure = DEFAULT_PROCEDURE }: ThresholdOptions = {},
): Threshold {
  const base = { ruleId: rule.id, verified: rule.verified, note: rule.note, abstentions: 0 };

  if (rule.basis === 'full') {
    return {
      ...base,
      basis: 'full',
      needed: rule.needed,
      denominator: seatCount,
      reachable: rule.needed <= seatCount,
      label: `${rule.needed} of ${seatCount}`,
    };
  }

  if (rule.basis === 'consent') {
    return {
      ...base,
      basis: 'consent',
      needed: 1,
      denominator: presentCount,
      reachable: presentCount > 0,
      label: 'Any 1 member',
    };
  }

  const abstentions = procedure.recusal === 'present' ? recused : 0;
  const denominator = presentCount + abstentions;
  const needed = rule.fraction
    ? fractionOf(denominator, rule.fraction.numerator, rule.fraction.denominator)
    : presentMajority(denominator, procedure.tieBreak);
  const notes = [rule.note];
  if (abstentions > 0) {
    notes.push(`${abstentions} recused member${plural(abstentions)} counted as present`);
  }
  if (!rule.fraction && procedure.tieBreak === 'chair' && denominator % 2 === 0) {
    notes.push('a tie is decided by the chair');
  }
  return {
    ...base,
    note: notes.filter(Boolean).join(' · '),
    abstentions,
    basis: 'present',
    needed,
    denominator,
    reachable: presentCount > 0 && needed <= presentCount,
    label: denominator > 0 ? `${needed} of ${denominator} present` : 'No members present',
  };
}

export function goalTarget(threshold: Threshold, direction: Direction): number {
  if (threshold.basis === 'consent' || direction === 'support') return threshold.needed;
  return Math.max(1, threshold.denominator - threshold.needed + 1);
}

export function unreachableReason(threshold: Threshold, votingCount: number): string {
  if (votingCount === 0) return 'No members present: nothing can be voted on';
  if (threshold.basis === 'full' && !threshold.reachable) {
    return `This rule needs ${threshold.label} seats: it can’t be met`;
  }
  return `This rule needs ${threshold.label}, more than the members able to vote: it can’t be met`;
}

export function thresholdPreviewLine(threshold: Threshold): string {
  return threshold.basis === 'consent'
    ? `${threshold.label} may pull the item. ${threshold.note}`
    : `Threshold: ${threshold.label}. ${threshold.note}`;
}

export function findRule(rules: ActionRule[], id: ActionRule['id']): ActionRule {
  const rule = rules.find((r) => r.id === id);
  if (!rule) throw new Error(`Unknown action rule: ${id}`);
  return rule;
}

export function ruleOrOrdinary(rules: ActionRule[], id: ActionRule['id']): ActionRule {
  return rules.find((r) => r.id === id) ?? findRule(rules, 'ordinary');
}
