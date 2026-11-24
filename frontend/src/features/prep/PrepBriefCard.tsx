import type { ReactNode } from 'react';
import { SourceLink } from '@/components/SourceLink';
import { BulletList } from '@/components/ui/BulletList';
import { Callout } from '@/components/ui/Callout';
import { EVIDENCE_PIECE_KIND_LABELS } from '@/data/evidence-kinds';
import { citationSourceName } from '@/features/simulation/simulation-citations';
import { NOT_A_QUOTE, NOTHING_IN_EVIDENCE } from '@/features/simulation/simulation-text';
import { initials } from '@/lib/members';
import type { StanceLabel } from '@/types/simulation';
import { MAX_DATA_GAPS, type PrepBrief } from './prep-brief';

const AI_BASIS = 'Simulated by AI from the cited dossier evidence.';

const HEADER_PILL =
  'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold whitespace-nowrap';

const HEADER_STANCE_CLASSES: Record<StanceLabel, string> = {
  'Strong Oppose': 'bg-brick-bg text-brick',
  'Lean Oppose': 'bg-brick-bg text-brick',
  Undecided: 'bg-white/90 text-navy/75',
  'Lean Support': 'bg-pine-bg text-pine',
  'Strong Support': 'bg-pine-bg text-pine',
};

function BriefCard({
  title,
  basis,
  className = '',
  children,
}: {
  title: string;
  basis: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 ${className}`}
    >
      <h3 className="font-display text-[15px] font-bold text-navy">{title}</h3>
      <div className="flex-1 text-[13px] leading-relaxed text-ink/80">{children}</div>
      <div className="border-t border-line2 pt-3 text-[11px] text-muted">{basis}</div>
    </div>
  );
}

function BriefList({ items }: { items: string[] }) {
  return <BulletList items={items} empty={NOTHING_IN_EVIDENCE} className="space-y-3" />;
}

export function PrepBriefCard({ brief }: { brief: PrepBrief }) {
  const { member, answer } = brief;
  const sources = answer.citations;
  const gaps = member.data_gaps.slice(0, MAX_DATA_GAPS);

  return (
    <div className="space-y-5">
      <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-linear-to-r from-navy via-navy to-[#1d3b4f] p-5 text-white shadow-elevated sm:gap-5 sm:px-6 sm:py-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(200_155_60/0.10),transparent_55%)]"
        />
        <span
          aria-hidden="true"
          className="relative grid size-14 shrink-0 place-items-center rounded-full bg-[#f8eedb] font-display text-base font-bold text-navy sm:size-16 sm:text-lg"
        >
          {initials(member.name)}
        </span>
        <div className="relative min-w-0 space-y-1.5">
          <span className="block text-[10px] font-bold tracking-[0.16em] text-gold uppercase">
            Rehearsal brief
          </span>
          <h2 className="font-display text-xl leading-tight font-bold sm:text-2xl">
            {answer.memberName}
          </h2>
          <p className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className={`${HEADER_PILL} bg-white/12 text-white ring-1 ring-white/15`}>
              {member.district}
            </span>
            <span className={`${HEADER_PILL} ${HEADER_STANCE_CLASSES[answer.stance]}`}>
              {answer.stance}
            </span>
            <span className={`${HEADER_PILL} bg-gold2 text-amber`}>
              {answer.confidence} confidence
            </span>
          </p>
        </div>
      </div>

      {member.basis === 'unreviewed' && (
        <Callout title="Based on an unreviewed draft">
          No version of {answer.memberName}&rsquo;s dossier has been approved yet, so this brief
          uses version {answer.versionNo}, which nobody has reviewed.
        </Callout>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <h3 className="font-display text-[15px] font-bold text-navy">Simulated opening response</h3>
        <blockquote className="flex gap-3 rounded-xl bg-amber-bg px-4 py-4 sm:gap-4 sm:px-5 sm:py-5">
          <span
            aria-hidden="true"
            className="-mt-1 shrink-0 font-display text-4xl leading-none font-bold text-gold"
          >
            &ldquo;
          </span>
          <p className="font-display text-[15px] leading-relaxed text-navy/90 italic sm:text-base">
            {answer.answer}
          </p>
        </blockquote>
        {sources.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <li
                key={source.label}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-paper px-2 py-1 text-[11px] text-muted ring-1 ring-line2"
              >
                <strong className="font-bold text-navy">{source.label}</strong>
                <SourceLink name={citationSourceName(source)} url={source.sourceUrl} />
              </li>
            ))}
          </ul>
        )}
        <p className="-mt-1 text-[11px] text-muted">{NOT_A_QUOTE}</p>
      </div>

      <BriefCard title="Why this stance" basis={AI_BASIS}>
        <p className="text-[13px] leading-relaxed text-ink/85">{answer.reasoning}</p>
      </BriefCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BriefCard title="Landmines to avoid" basis={AI_BASIS}>
          <BriefList items={answer.concerns} />
        </BriefCard>

        <BriefCard title="What a “yes” requires" basis={AI_BASIS}>
          <BriefList items={answer.levers} />
        </BriefCard>

        <BriefCard title="Likely questions" basis={AI_BASIS}>
          <BriefList items={answer.questions} />
        </BriefCard>
      </div>

      <BriefCard
        title="Evidence the simulation relied on"
        basis={`From ${answer.memberName}’s dossier, version ${String(answer.versionNo)}.`}
      >
        {answer.citations.length === 0 ? (
          <p className="text-muted italic">
            No dossier evidence was cited, so treat this read as a low-information guess.
          </p>
        ) : (
          <ol className="divide-y divide-line2">
            {answer.citations.map((citation) => (
              <li key={citation.label} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-navy text-[11px] font-bold text-white">
                  {citation.label}
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-ink/85">{citation.text}</p>
                  <p className="text-[11px] text-muted">
                    {EVIDENCE_PIECE_KIND_LABELS[citation.kind]} ·{' '}
                    <SourceLink name={citationSourceName(citation)} url={citation.sourceUrl} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </BriefCard>

      {gaps.length > 0 && (
        <Callout title="Data-gap warning" className="p-5">
          <BulletList items={gaps} className="mt-1" />
        </Callout>
      )}
    </div>
  );
}
