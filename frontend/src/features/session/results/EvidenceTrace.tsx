import { SourceList } from '@/components/SourceList';
import { citations } from '@/lib/simulation/scoring';
import type { MemberRow } from '@/types/simulation';

export function EvidenceTrace({ row }: { row: MemberRow }) {
  const cites = citations(row);
  return (
    <div className="rounded-xl border border-line2 bg-paper/70 px-3.5 py-2.5 text-xs leading-relaxed text-muted">
      <strong className="font-semibold text-navy">Evidence trace · </strong>
      {cites.length > 0 ? <SourceList citations={cites} /> : <span>No direct source found</span>}
      <span className="text-muted/80">
        {' '}
        · Dossier fields: issue_positions, key_votes, opposition_triggers, persuasion_levers
      </span>
    </div>
  );
}
