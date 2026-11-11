import { useCallback } from 'react';
import { SourceLink } from '@/components/SourceLink';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { AlertIcon, SourceDocIcon } from '@/components/ui/icons';
import { EVIDENCE_KIND_LABELS, RECORD_OUTCOME_LABELS } from '@/data/dossier-options';
import { isHttpUrl } from '@/lib/url';
import { EVIDENCE_KINDS } from '@/types/dossier';
import { getEvidence, type EvidenceItem } from './dossier-api';
import { issueLabel, recordDate } from './dossier-format';
import { LoadError } from './DossierStates';
import { useLoad } from './use-load';

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function describe(item: EvidenceItem): { key: string; reference: string; excerpt: string } {
  switch (item.kind) {
    case 'issue_position':
      return {
        key: `issue:${item.topic}`,
        reference: issueLabel(item.topic),
        excerpt: item.evidence || item.stance,
      };
    case 'key_record':
      return {
        key: `record:${item.lineageId}`,
        reference: item.title,
        excerpt: [
          recordDate(item),
          item.outcome === 'none' ? '' : RECORD_OUTCOME_LABELS[item.outcome],
          item.description,
        ]
          .filter(Boolean)
          .join(' · '),
      };
    case 'quote':
      return { key: `quote:${item.lineageId}`, reference: `“${item.text}”`, excerpt: item.context };
    case 'mayor_alignment':
      return {
        key: 'mayor',
        reference: item.relationship || 'Mayor alignment',
        excerpt: item.example,
      };
    case 'voice_example':
      return {
        key: 'voice',
        reference: item.quote ? `“${item.quote}”` : 'Voice example',
        excerpt: item.context,
      };
  }
}

/** Loads and lists the evidence of one version (the current one when `versionNo` is omitted). */
export function EvidenceTab({ dossierId, versionNo }: { dossierId: string; versionNo?: number }) {
  const fetchEvidence = useCallback(
    () => getEvidence(dossierId, versionNo),
    [dossierId, versionNo],
  );
  const { loaded, reload } = useLoad(fetchEvidence);
  if (loaded.state === 'loading') return <Loader label="Loading evidence…" />;
  if (loaded.state === 'error') {
    return (
      <LoadError title="Evidence couldn’t be loaded" message={loaded.message} onRetry={reload} />
    );
  }
  return <EvidenceList items={loaded.data} />;
}

/** The sources one version cites, grouped by the dossier section that cites them. */
export function EvidenceList({ items }: { items: EvidenceItem[] }) {
  if (items.length === 0) {
    return <EmptyState title="No evidence yet">This version cites no sources.</EmptyState>;
  }
  const missing = items.filter((i) => !isHttpUrl(i.sourceUrl)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>
          <SourceDocIcon className="size-3.5" />
          {items.length} {items.length === 1 ? 'source' : 'sources'}
        </Badge>
        {missing > 0 && (
          <Badge className="border border-gold/45 bg-amber-bg text-amber">
            <AlertIcon className="size-3.5 text-gold" />
            {missing} without a usable link
          </Badge>
        )}
      </div>

      {EVIDENCE_KINDS.map((kind) => {
        const group = items.filter((i) => i.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind} className="space-y-3">
            <h3 className="font-display text-lg font-bold text-navy">
              {EVIDENCE_KIND_LABELS[kind]}{' '}
              <span className="text-sm font-semibold text-muted">({group.length})</span>
            </h3>
            <ul className="grid gap-2.5">
              {group.map((item) => {
                const { key, reference, excerpt } = describe(item);
                const linked = isHttpUrl(item.sourceUrl);
                return (
                  <li
                    key={key}
                    className="rounded-xl border border-line bg-white p-4 text-[13px] leading-relaxed shadow-card"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h4 className="min-w-0 font-semibold text-navy">{reference}</h4>
                      {linked ? (
                        <span className="shrink-0 text-[11px] font-semibold text-muted">
                          {hostOf(item.sourceUrl)}
                        </span>
                      ) : (
                        <Badge className="shrink-0 self-start border border-gold/45 bg-amber-bg text-amber">
                          No usable link
                        </Badge>
                      )}
                    </div>
                    {excerpt && <p className="mt-1 text-xs text-ink/75">{excerpt}</p>}
                    <p className="mt-2 text-xs">
                      <SourceLink
                        name={item.sourceName || hostOf(item.sourceUrl)}
                        url={item.sourceUrl}
                      />
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
