import { SourceList } from '@/components/SourceList';
import { citations } from '@/lib/simulation/scoring';
import type { MemberRow } from '@/types/simulation';

export function EvidenceTrace({ row }: { row: MemberRow }) {
  const cites = citations(row);
  return (
    <div className="mt-3 rounded-lg border border-line/60 bg-paper/50 p-2.5 font-sans text-xs leading-relaxed text-navy/60">
      <strong className="font-semibold text-navy">Evidence trace · </strong>
      {cites.length > 0 ? <SourceList citations={cites} /> : <span>No direct source found</span>}
      <span className="text-navy/50">
        {' '}
        · Dossier fields: issue_positions, key_votes, opposition_triggers, persuasion_levers
      </span>
    </div>
  );
}
