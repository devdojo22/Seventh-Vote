import { CATEGORY_LABELS } from '@/data/agenda';
import type { SimulationAgenda } from '@/features/simulation/simulation-api';
import type { ActionRule, SessionInput } from '@/types/simulation';

export function sessionAgenda(input: SessionInput, rule: ActionRule): SimulationAgenda {
  return {
    title: input.title,
    description: input.desc,
    category: CATEGORY_LABELS[input.category],
    ask: input.ask,
    context: {
      actionType: rule.label,
      fiscalImpact: input.fiscal,
      mayorPriority: input.priority === 'yes',
      districtImpact: input.impact,
      ...(input.impact === 'specific' && { districts: input.districts }),
      committee: input.committee,
      committeeChair: input.committeeChair,
    },
  };
}
