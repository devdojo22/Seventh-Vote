import { STANCES } from '@/data/stances';
import type { StanceLabel } from '@/types/simulation';

export function StancePill({ stance }: { stance: StanceLabel }) {
  const pillClass = STANCES.find((s) => s.label === stance)?.pillClass ?? '';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wider uppercase ${pillClass}`}
    >
      {stance}
    </span>
  );
}
