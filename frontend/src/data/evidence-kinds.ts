import type { EvidencePieceKind } from '@/types/simulation';

export const EVIDENCE_PIECE_KIND_LABELS: Record<EvidencePieceKind, string> = {
  key_record: 'Key record',
  quote: 'Quote',
  issue_position: 'Issue position',
  profile: 'Profile',
  political_style: 'Political style',
  voting_bloc: 'Voting bloc',
};
