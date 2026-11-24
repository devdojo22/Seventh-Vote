import { useId, useState, type ReactNode } from 'react';
import { StancePill } from '@/components/StancePill';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { BulletList } from '@/components/ui/BulletList';
import { ChevronDownIcon } from '@/components/ui/icons';
import { UnreviewedBadge } from '@/features/dossiers/DossierBadges'; // M4/01
import { NOT_A_QUOTE, NOTHING_IN_EVIDENCE } from '@/features/simulation/simulation-text';
import { hasNoDirectEvidence } from '@/lib/simulation/member-rows';
import type { MemberRow } from '@/types/simulation';
import { EvidenceTrace } from './EvidenceTrace';

function participationLabel(row: MemberRow): string {
  if (row.participation === 'present') return `${row.confidence} confidence`;
  return `${row.participation === 'absent' ? 'Absent' : 'Recused'} · not counted`;
}

function notSimulatedText(row: MemberRow): string {
  return `Not simulated: ${row.participation === 'recused' ? 'recused' : 'absent'} members don’t vote on this item.`;
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-line bg-paper/70 p-4 sm:p-5">
      <h4 className="text-[11px] font-bold tracking-[0.12em] text-navy/80 uppercase">{title}</h4>
      {children}
    </div>
  );
}

export function MemberReadCard({ row }: { row: MemberRow }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-card transition-colors ${open ? 'border-navy/25' : 'border-line hover:border-navy/20'}`}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-5 gap-y-2.5 px-4 py-4 text-left select-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset focus-visible:outline-none sm:px-5 lg:grid-cols-[minmax(0,1fr)_17rem_minmax(0,1.15fr)_auto]"
        >
          <span className="flex min-w-0 items-center gap-3.5">
            <Avatar name={row.member.name} size="md" />
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold text-navy">
                {row.member.name}
              </span>
              <small className="block truncate text-[13px] font-normal text-muted">
                {row.member.district}
              </small>
            </span>
          </span>

          <span
            aria-hidden="true"
            className={`grid size-9 shrink-0 place-items-center rounded-full border border-line bg-white text-navy transition-transform lg:order-last ${open ? 'rotate-180' : ''}`}
          >
            <ChevronDownIcon className="size-4" />
          </span>

          <span className="col-span-2 flex flex-wrap items-center gap-1.5 lg:col-span-1">
            {row.stance && <StancePill stance={row.stance} />}
            <Badge
              className={
                row.participation === 'present'
                  ? 'border border-line bg-white text-navy/80'
                  : 'border border-gold/40 bg-amber-bg text-amber'
              }
            >
              {participationLabel(row)}
            </Badge>
            {row.participation === 'present' && hasNoDirectEvidence(row) && (
              <Badge className="border border-gold/40 bg-amber-bg text-amber">
                No direct evidence
              </Badge>
            )}
            {/* M4/01 */}
            {row.member.basis === 'unreviewed' && <UnreviewedBadge />}
          </span>

          <span className="col-span-2 line-clamp-2 text-[13px] font-normal text-muted italic lg:col-span-1 lg:line-clamp-1">
            {row.answer ? (
              <>
                {row.answer.answer}{' '}
                <em className="text-muted/70 not-italic">Simulated, not a quote.</em>
              </>
            ) : (
              notSimulatedText(row)
            )}
          </span>
        </button>
      </h3>

      {open && (
        <div id={panelId} className="animate-fade-in space-y-3.5 border-t border-line2 p-4 sm:p-5">
          {row.answer ? (
            <>
              <div className="grid grid-cols-1 gap-3.5 text-[13px] leading-relaxed text-ink/85 sm:grid-cols-2 xl:grid-cols-4">
                <DetailBlock title="In their voice">
                  <p className="text-ink/85">{row.answer.answer}</p>
                  <p className="text-xs text-muted italic">{NOT_A_QUOTE}</p>
                </DetailBlock>
                <DetailBlock title="Top concerns">
                  <BulletList
                    items={row.answer.concerns}
                    empty={NOTHING_IN_EVIDENCE}
                    className="space-y-2.5"
                  />
                </DetailBlock>
                <DetailBlock title="Questions they may ask">
                  <BulletList
                    items={row.answer.questions}
                    empty={NOTHING_IN_EVIDENCE}
                    className="space-y-2.5"
                  />
                </DetailBlock>
                <DetailBlock title="What could move them">
                  <BulletList
                    items={row.answer.levers}
                    empty={NOTHING_IN_EVIDENCE}
                    className="space-y-2.5"
                  />
                </DetailBlock>
              </div>
              <p className="rounded-xl border border-line bg-white px-4 py-3.5 text-[13px] leading-relaxed text-ink/85 sm:px-5">
                <strong className="font-bold text-navy">Why this read</strong> ·{' '}
                {row.answer.reasoning}
              </p>
              <EvidenceTrace citations={row.answer.citations} />
            </>
          ) : (
            <p className="text-xs text-muted">{notSimulatedText(row)}</p>
          )}
        </div>
      )}
    </article>
  );
}
