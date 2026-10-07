import { useId, useState } from 'react';
import { StancePill } from '@/components/StancePill';
import { initials } from '@/lib/members';
import { questions } from '@/lib/simulation/scoring';
import type { MemberRow, SessionInput } from '@/types/simulation';
import { EvidenceTrace } from './EvidenceTrace';

function participationLabel(row: MemberRow): string {
  if (row.participation === 'present') return `${row.confidence} confidence`;
  return `${row.participation === 'absent' ? 'Absent' : 'Recused'} · not counted`;
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1.5 rounded-xl border border-line bg-white p-3.5">
      <h4 className="border-b border-line/60 pb-1.5 text-[11px] font-semibold tracking-wider text-navy/70 uppercase">
        {title}
      </h4>
      <ul className="list-inside list-disc space-y-1 text-navy/80">
        {items.map((item) => (
          <li key={item} className="leading-snug">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One expandable member read. */
export function MemberReadCard({ row, input }: { row: MemberRow; input: SessionInput }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-2xs transition-all duration-200 hover:border-navy/30">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full cursor-pointer flex-col items-start justify-between gap-3 p-3.5 text-left select-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset focus-visible:outline-none sm:flex-row sm:items-center sm:gap-4 sm:p-5"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy font-display text-xs font-bold text-gold shadow-2xs">
              {initials(row.member.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-sans text-sm font-semibold text-navy">
                {row.member.name}
              </span>
              <small className="block font-sans text-xs font-normal text-navy/60">
                {row.member.district}
              </small>
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2">
            <StancePill stance={row.stance} />
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                row.participation === 'present'
                  ? 'border border-line bg-paper text-navy/70'
                  : 'border border-steel/20 bg-amber-bg text-steel'
              }`}
            >
              {participationLabel(row)}
            </span>
          </span>

          <span className="line-clamp-2 max-w-md font-sans text-xs font-normal text-navy/70 italic sm:line-clamp-1">
            {row.reason} <em className="text-navy/40 not-italic">Simulated, not a quote.</em>
          </span>

          <span
            aria-hidden="true"
            className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-paper/60 text-sm font-bold text-navy sm:ml-0"
          >
            {open ? '⌃' : '⌄'}
          </span>
        </button>
      </h3>

      {open && (
        <div id={panelId} className="space-y-4 border-t border-line bg-paper/20 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 font-sans text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 rounded-xl border border-line bg-white p-3.5">
              <h4 className="border-b border-line/60 pb-1.5 text-[11px] font-semibold tracking-wider text-navy/70 uppercase">
                In their voice
              </h4>
              <p className="leading-relaxed font-medium text-navy">{row.reason}</p>
              <p className="text-[11px] text-navy/50 italic">
                Rehearsal language; not a verbatim quote.
              </p>
            </div>
            <DetailList title="Top concerns" items={row.concerns} />
            <DetailList title="Questions they may ask" items={questions(row, input)} />
            <DetailList title="What could move them" items={row.levers} />
          </div>
          <EvidenceTrace row={row} />
        </div>
      )}
    </article>
  );
}
