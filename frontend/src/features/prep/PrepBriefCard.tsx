import type { ReactNode } from 'react';
import { SourceList } from '@/components/SourceList';
import { initials } from '@/lib/members';
import type { PrepBrief } from '@/lib/simulation/prep-brief';

const CARD_CLASS = 'space-y-3 rounded-xl border border-line bg-paper/30 p-4 sm:p-5';
const BASIS_CLASS =
  'rounded-lg border border-line/60 bg-white/80 p-2.5 font-sans text-xs text-navy/60';

function BriefCard({
  title,
  className = '',
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${CARD_CLASS} ${className}`}>
      <h3 className="border-b border-line/60 pb-2 font-display text-sm font-bold tracking-wider text-navy uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ items, render }: { items: string[]; render?: (item: string) => ReactNode }) {
  return (
    <ul className="list-inside list-disc space-y-1.5 font-sans text-xs text-navy/80 sm:text-sm">
      {items.map((item) => (
        <li key={item} className="leading-snug">
          {render ? render(item) : item}
        </li>
      ))}
    </ul>
  );
}

export function PrepBriefCard({ brief }: { brief: PrepBrief }) {
  const { member, levers, concerns } = brief;

  return (
    <div className="space-y-6 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 rounded-xl border border-line bg-paper/40 p-4 sm:p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-gold shadow-2xs">
          {initials(member.name)}
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-navy sm:text-2xl">{member.name}</h2>
          <p className="font-sans text-xs text-navy/70 sm:text-sm">
            {member.district} · {brief.stance} · {brief.confidence} confidence
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        <BriefCard title="How to frame the pitch" className="md:col-span-2">
          <p className="font-sans text-xs leading-relaxed text-navy sm:text-sm">
            Lead with {levers[0] || 'a specific, measurable public benefit'}. Then connect the
            proposal to {levers[1] || 'their documented policy priorities'} and show exactly how the
            commitment will be measured.
          </p>
          <div className={BASIS_CLASS}>
            Basis: persuasion_levers · <SourceList citations={brief.citations} />
          </div>
        </BriefCard>

        <BriefCard title="Landmines to avoid">
          <BulletList items={concerns} />
          <div className={BASIS_CLASS}>Basis: opposition_triggers</div>
        </BriefCard>

        <BriefCard title="Likely questions">
          <BulletList items={brief.questions} />
          <div className={BASIS_CLASS}>Basis: issue_positions + district</div>
        </BriefCard>

        <BriefCard title="Likely objections">
          <BulletList
            items={concerns}
            render={(x) =>
              `“I need the proposal to address ${x.charAt(0).toLowerCase() + x.slice(1)}.”`
            }
          />
          <div className={BASIS_CLASS}>
            Simulated language from opposition_triggers; not quotes.
          </div>
        </BriefCard>

        <BriefCard title="What a “yes” requires">
          <BulletList items={levers} />
          <div className={BASIS_CLASS}>Basis: persuasion_levers</div>
        </BriefCard>

        <BriefCard title="Simulated opening response" className="md:col-span-2">
          <p className="rounded-lg border border-line/60 bg-white p-3.5 font-sans text-xs leading-relaxed text-navy/90 italic sm:text-sm">
            {brief.opening}
          </p>
          <div className={BASIS_CLASS}>
            <SourceList citations={brief.citations} /> · Rehearsal language, not a verbatim quote.
          </div>
          {brief.gaps.length > 0 && (
            <div className="mt-3 space-y-1 rounded-xl border border-gold/40 bg-amber-bg/80 p-3.5 font-sans text-xs text-navy">
              <strong className="block font-semibold tracking-wider text-navy uppercase">
                Data-gap warning
              </strong>
              <ul className="list-inside list-disc space-y-0.5 text-navy/80">
                {brief.gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
        </BriefCard>
      </div>
    </div>
  );
}
