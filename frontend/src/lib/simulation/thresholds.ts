import type { ActionRule, Direction, Threshold } from '@/types/simulation';

/** Passage threshold for a rule, given how many members are present. */
export function thresholdFor(rule: ActionRule, presentCount: number, seatCount: number): Threshold {
  const base = { ruleId: rule.id, verified: rule.verified, note: rule.note };

  if (rule.basis === 'full') {
    return {
      ...base,
      basis: 'full',
      needed: rule.needed,
      denominator: seatCount,
      reachable: true,
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

  const needed = Math.floor(presentCount / 2) + 1;
  return {
    ...base,
    basis: 'present',
    needed,
    denominator: presentCount,
    reachable: presentCount > 0,
    label: presentCount > 0 ? `${needed} of ${presentCount} present` : 'No members present',
  };
}

/**
 * Votes the user's side needs. Passing takes `needed`; blocking takes enough
 * non-yes votes that `needed` can no longer be reached.
 */
export function goalTarget(threshold: Threshold, direction: Direction): number {
  if (threshold.basis === 'consent' || direction === 'support') return threshold.needed;
  return Math.max(1, threshold.denominator - threshold.needed + 1);
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
