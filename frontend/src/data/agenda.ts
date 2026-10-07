import type { Ask, CategoryId, Direction } from '@/types/simulation';

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  budget_taxes: 'Budget & Taxes',
  economic_development_pilots: 'Economic Development & PILOTs',
  public_safety: 'Public Safety',
  mlgw_utilities: 'MLGW & Utilities',
  housing: 'Housing',
  transit_infrastructure: 'Transit & Infrastructure',
  neighborhoods_services: 'Neighborhood Services',
  education_youth: 'Youth & Education',
};

/** Keyword hints used to match key votes to a category. */
export const CATEGORY_TERMS: Record<CategoryId, string[]> = {
  budget_taxes: ['budget', 'tax', 'fee', 'fiscal', 'revenue'],
  economic_development_pilots: ['pilot', 'development', 'xai', 'data center', 'jobs', 'economic'],
  public_safety: ['safety', 'police', 'crime', 'fire', 'jail'],
  mlgw_utilities: ['mlgw', 'utility', 'water', 'power', 'energy', 'tva'],
  housing: ['housing', 'home', 'shelter', 'development'],
  transit_infrastructure: ['transit', 'mata', 'street', 'road', 'transportation', 'infrastructure'],
  neighborhoods_services: ['neighborhood', 'blight', 'park', 'solid waste', 'service'],
  education_youth: ['youth', 'school', 'education', 'student', 'children'],
};

export const ASK_DIRECTIONS: Record<Ask, Direction> = {
  Approval: 'support',
  Funding: 'support',
  'Ordinance change': 'support',
  'Resolution of support': 'support',
  Oppose: 'oppose',
};
