import { useId, useState, type ReactNode } from 'react';
import { StancePill } from '@/components/StancePill';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { BulletList } from '@/components/ui/BulletList';
import { ChevronDownIcon } from '@/components/ui/icons';
import { questions } from '@/lib/simulation/scoring';
import type { MemberRow, SessionInput } from '@/types/simulation';
import { EvidenceTrace } from './EvidenceTrace';

function participationLabel(row: MemberRow): string {
  if (row.participation === 'present') return `${row.confidence} confidence`;
  return `${row.participation === 'absent' ? 'Absent' : 'Recused'} · not counted`;
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl border border-line bg-white p-4">
      <h4 className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">{title}</h4>
      {children}
    </div>
  );
}

export function MemberReadCard({ row, input }: { row: MemberRow; input: SessionInput }) {
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
          className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 px-4 py-3.5 text-left select-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset focus-visible:outline-none sm:px-5 lg:grid-cols-[minmax(200px,1fr)_auto_minmax(0,1.4fr)_auto]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <Avatar name={row.member.name} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-navy">
                {row.member.name}
              </span>
              <small className="block truncate text-xs font-normal text-muted">
                {row.member.district}
              </small>
            </span>
          </span>

          <span
            aria-hidden="true"
            className={`grid size-8 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform lg:order-last ${open ? 'rotate-180 bg-paper' : ''}`}
          >
            <ChevronDownIcon className="size-4" />
          </span>

          <span className="col-span-2 flex flex-wrap items-center gap-1.5 lg:col-span-1">
            <StancePill stance={row.stance} />
            <Badge
              className={
                row.participation === 'present'
                  ? undefined
                  : 'border border-gold/40 bg-amber-bg text-amber'
              }
            >
              {participationLabel(row)}
            </Badge>
          </span>

          <span className="col-span-2 line-clamp-2 text-xs font-normal text-muted italic lg:col-span-1 lg:line-clamp-1">
            {row.reason} <em className="text-muted/70 not-italic">Simulated, not a quote.</em>
          </span>
        </button>
      </h3>

      {open && (
        <div
          id={panelId}
          className="animate-fade-in space-y-3 border-t border-line2 bg-paper/60 p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-3 text-xs text-ink/80 sm:grid-cols-2 xl:grid-cols-4">
            <DetailBlock title="In their voice">
              <p className="leading-relaxed font-medium text-navy">{row.reason}</p>
              <p className="text-[11px] text-muted italic">
                Rehearsal language; not a verbatim quote.
              </p>
            </DetailBlock>
            <DetailBlock title="Top concerns">
              <BulletList items={row.concerns} />
            </DetailBlock>
            <DetailBlock title="Questions they may ask">
              <BulletList items={questions(row, input)} />
            </DetailBlock>
            <DetailBlock title="What could move them">
              <BulletList items={row.levers} />
            </DetailBlock>
          </div>
          <EvidenceTrace row={row} />
        </div>
      )}
    </article>
  );
}
