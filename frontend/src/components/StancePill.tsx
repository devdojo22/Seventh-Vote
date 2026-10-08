import { STANCES } from '@/data/stances';
import type { StanceLabel } from '@/types/simulation';
import { Badge } from './ui/Badge';

export function StancePill({ stance }: { stance: StanceLabel }) {
  const pillClass = STANCES.find((s) => s.label === stance)?.pillClass ?? '';
  return <Badge className={pillClass}>{stance}</Badge>;
}
