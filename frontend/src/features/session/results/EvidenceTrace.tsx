import { SourceLink } from '@/components/SourceLink';
import type { SimulationCitation } from '@/features/simulation/simulation-api';
import { citationSourceName } from '@/features/simulation/simulation-citations';

export function EvidenceTrace({ citations }: { citations: readonly SimulationCitation[] }) {
  return (
    <div className="rounded-xl bg-paper px-4 py-3.5 text-xs leading-relaxed text-muted sm:px-5">
      <strong className="font-bold text-navy">Evidence trace</strong>
      {citations.length > 0 ? (
        citations.map((c) => (
          <span key={c.label}>
            {' · '}
            <strong className="font-bold text-navy">{c.label}</strong>
            {' · '}
            <SourceLink name={citationSourceName(c)} url={c.sourceUrl} />
          </span>
        ))
      ) : (
        <span> · No dossier evidence was cited</span>
      )}
    </div>
  );
}
