import type { ReactNode } from 'react';
import { SourceLink } from '@/components/SourceLink';
import { isHttpUrl } from '@/lib/url';
import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { EmptyState } from '@/components/ui/EmptyState';
import { RECORD_OUTCOME_LABELS, RECORD_TYPE_LABELS } from '@/data/dossier-options';
import type { DossierContent } from './dossier-api';
import { StanceLabelBadge } from './DossierBadges';
import { issueLabel, recordDate } from './dossier-format';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-lg font-bold text-navy">{title}</h3>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper px-3.5 py-3">
      <dt className="text-[11px] font-bold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-semibold text-navy">{value || '—'}</dd>
    </div>
  );
}

/** A source citation. `label` ("Source", "View source") is link text, so it is used only when there is a
 * usable link; otherwise the source's own name is shown. */
function Source({ name, url, label }: { name: string; url: string; label?: string }) {
  if (!name && !url) return null;
  return (
    <p className="text-xs">
      <SourceLink name={name} url={url} label={isHttpUrl(url) ? (label ?? name) : name} />
    </p>
  );
}

function Bullets({ items }: { items: { text: string; inferred: boolean }[] }) {
  if (items.length === 0) return <p className="text-xs text-muted">None recorded.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => (
        <li key={`${String(index)}-${item.text}`} className="flex gap-2.5 leading-snug">
          <span aria-hidden="true" className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-gold" />
          <span className="min-w-0">
            {item.text}
            {item.inferred && (
              <span className="ml-1.5 text-[11px] font-semibold text-muted">(inferred)</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Read-only view of one dossier version: the shared, public-record profile. */
export function DossierContentView({ content }: { content: DossierContent }) {
  const { voiceEvidence: voice, decisionPattern: pattern, mayorAlignment: mayor } = content;

  return (
    <div className="divide-y divide-line2 rounded-2xl border border-line bg-white text-[13px] leading-relaxed text-ink/80 shadow-card *:p-5 sm:*:p-6">
      <Section title="Profile">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Detail label="District" value={content.district} />
          <Detail label="Took office" value={content.tookOffice} />
          <Detail label="Leadership role" value={content.leadershipRole} />
        </dl>
        <p>{content.profile || 'No profile recorded.'}</p>
        <p>
          <strong className="font-semibold text-navy">Political style:</strong>{' '}
          {content.politicalArchetype && <>{content.politicalArchetype}. </>}
          {content.politicalStyle || 'Not recorded.'}
        </p>
      </Section>

      <Section title="Committees & leadership">
        {content.committees.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {content.committees.map((c, index) => (
              <div
                className="rounded-xl bg-paper px-3.5 py-3 text-xs"
                key={`${String(index)}-${c.committee}`}
              >
                <strong className="mb-0.5 block font-semibold text-navy">{c.committee}</strong>
                <span className="text-muted">
                  {[c.role, c.year].filter(Boolean).join(' · ') || '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No committee assignments recorded.</EmptyState>
        )}
      </Section>

      <Section title="Issue positions">
        {content.issuePositions.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {content.issuePositions.map((p) => (
              <div className="space-y-1.5 rounded-xl border border-line p-3.5" key={p.topic}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-[13px] font-semibold text-navy capitalize">
                    {issueLabel(p.topic)}
                  </h4>
                  {p.stanceLabel && <StanceLabelBadge value={p.stanceLabel} />}
                </div>
                {p.stance && <p className="text-xs">{p.stance}</p>}
                {p.evidence && <p className="text-xs text-ink/70">{p.evidence}</p>}
                <Source name={p.sourceName} url={p.sourceUrl} label="Source" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No issue positions recorded.</EmptyState>
        )}
      </Section>

      <Section title="Key record">
        {content.keyRecords.length > 0 ? (
          <ol className="relative space-y-4 border-l border-line pl-5">
            {content.keyRecords.map((r) => (
              <li className="relative space-y-1" key={r.lineageId}>
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 -left-[23.5px] size-2 rounded-full bg-gold ring-4 ring-white"
                />
                <h4 className="text-[13px] font-semibold text-ink">{r.title}</h4>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted">
                  <Badge>{RECORD_TYPE_LABELS[r.type]}</Badge>
                  {r.outcome !== 'none' && <Badge>{RECORD_OUTCOME_LABELS[r.outcome]}</Badge>}
                  {recordDate(r) && <span>{recordDate(r)}</span>}
                </div>
                {r.description && <p className="text-xs">{r.description}</p>}
                <Source name={r.sourceName} url={r.sourceUrl} label="View source" />
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState>No key record entries.</EmptyState>
        )}
      </Section>

      <Section title="Thinking Evidence">
        <p>{voice.description || 'No speaking style recorded.'}</p>
        {voice.example.quote && (
          <figure className="rounded-xl border border-line p-4">
            <figcaption className="mb-1.5 text-[11px] font-bold tracking-wide text-muted uppercase">
              Example{voice.example.context ? ` · ${voice.example.context}` : ''}
            </figcaption>
            <blockquote className="text-[13px] text-navy">
              &ldquo;{voice.example.quote}&rdquo;
            </blockquote>
            <div className="mt-2">
              <Source
                name={voice.example.sourceName}
                url={voice.example.sourceUrl}
                label="Source"
              />
            </div>
          </figure>
        )}
        {voice.quotes.length > 0 ? (
          <div className="space-y-3">
            {voice.quotes.map((q) => (
              <figure className="rounded-xl bg-paper p-4" key={q.lineageId}>
                <blockquote className="border-l-2 border-gold pl-3.5 font-display text-base leading-snug text-navy italic sm:text-[17px]">
                  &ldquo;{q.text}&rdquo;
                </blockquote>
                <figcaption className="mt-2 space-y-0.5 pl-4 text-xs">
                  {(q.context || q.verbatim) && (
                    <span className="block text-muted">
                      {[q.context, q.verbatim ? 'Verbatim' : ''].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  <Source name={q.sourceName} url={q.sourceUrl} label="Source" />
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState>No direct quotes recorded.</EmptyState>
        )}
      </Section>

      <Section title="Decision pattern">
        <p>
          <strong className="font-semibold text-navy">Voting bloc:</strong>{' '}
          {pattern.votingBloc || 'Not recorded.'}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl bg-brick-bg/60 p-4">
            <strong className="block text-xs font-bold tracking-wide text-brick uppercase">
              Opposition triggers
            </strong>
            <Bullets items={pattern.oppositionTriggers} />
          </div>
          <div className="space-y-2 rounded-xl bg-pine-bg/70 p-4">
            <strong className="block text-xs font-bold tracking-wide text-pine uppercase">
              Persuasion levers
            </strong>
            <Bullets items={pattern.persuasionLevers} />
          </div>
        </div>
      </Section>

      <Section title="Mayor alignment">
        <p>
          <strong className="font-semibold text-navy">Relationship:</strong>{' '}
          {mayor.relationship || 'Not recorded.'}
        </p>
        {mayor.example && <p>{mayor.example}</p>}
        <Source name={mayor.sourceName} url={mayor.sourceUrl} label="Source" />
      </Section>

      <Section title="Data gaps">
        {content.dataGaps.length > 0 ? (
          <Callout>
            <ul className="space-y-1.5">
              {content.dataGaps.map((gap, index) => (
                <li key={`${String(index)}-${gap}`}>{gap}</li>
              ))}
            </ul>
          </Callout>
        ) : (
          <EmptyState>No data gaps recorded.</EmptyState>
        )}
      </Section>
    </div>
  );
}
