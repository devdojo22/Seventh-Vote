import type { Citation } from '@/types/simulation';
import { SourceLink } from './SourceLink';

/** Citations separated by middots. */
export function SourceList({ citations }: { citations: Citation[] }) {
  return (
    <>
      {citations.map((c, i) => (
        <span key={c.id}>
          {i > 0 && ' · '}
          <SourceLink name={c.name} url={c.url} label={c.label} />
        </span>
      ))}
    </>
  );
}
