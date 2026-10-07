import type { StanceDefinition } from '@/types/simulation';

/** Ordered from strongest opposition to strongest support; index = score + 2. */
export const STANCES: readonly StanceDefinition[] = [
  { score: -2, label: 'Strong Oppose', pillClass: 'bg-brick text-white', barClass: 'bg-brick' },
  { score: -1, label: 'Lean Oppose', pillClass: 'bg-brick-bg text-brick', barClass: 'bg-brick/50' },
  {
    score: 0,
    label: 'Undecided',
    pillClass: 'bg-paper text-navy/70 border border-line',
    barClass: 'bg-steel/50',
  },
  { score: 1, label: 'Lean Support', pillClass: 'bg-pine-bg text-pine', barClass: 'bg-pine/50' },
  { score: 2, label: 'Strong Support', pillClass: 'bg-pine text-white', barClass: 'bg-pine' },
];
