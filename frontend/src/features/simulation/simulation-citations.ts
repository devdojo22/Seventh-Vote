import { EVIDENCE_PIECE_KIND_LABELS } from '@/data/evidence-kinds';
import type { SimulationCitation } from './simulation-api';

export function citationSourceName(citation: SimulationCitation): string {
  return citation.sourceName || EVIDENCE_PIECE_KIND_LABELS[citation.kind];
}
