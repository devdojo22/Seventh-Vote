import type { ReactNode } from 'react';
import { SourceList } from '@/components/SourceList';
import { Avatar } from '@/components/ui/Avatar';
import { BulletList } from '@/components/ui/BulletList';
import { Callout } from '@/components/ui/Callout';
import type { PrepBrief } from '@/lib/simulation/prep-brief';

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
      className={`flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-card ${className}`}
    >
      <h3 className="font-display text-base font-bold text-navy">{title}</h3>
      <div className="flex-1 text-[13px] leading-relaxed text-ink/80">{children}</div>
      <div className="border-t border-line2 pt-3 text-xs text-muted">{basis}</div>
    </div>
  );
}

export function PrepBriefCard({ brief }: { brief: PrepBrief }) {
  const { member, levers, concerns } = brief;

  return (
    <div className="space-y-4">
      <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-navy p-5 text-white shadow-elevated sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(200_155_60/0.22),transparent_55%)]"
        />
        <Avatar name={member.name} size="lg" inverted />
        <div className="relative min-w-0">
          <span className="block text-[11px] font-bold tracking-[0.14em] text-gold2 uppercase">
            Rehearsal brief
          </span>
          <h2 className="font-display text-xl leading-tight font-bold sm:text-2xl">
            {member.name}
          </h2>
          <p className="text-[13px] text-white/70">
            {member.district} · {brief.stance} · {brief.confidence} confidence
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BriefCard
          title="How to frame the pitch"
          className="md:col-span-2"
          basis={
            <>
              Basis: persuasion_levers · <SourceList citations={brief.citations} />
            </>
          }
        >
          <p className="text-sm text-ink">
            Lead with {levers[0] || 'a specific, measurable public benefit'}. Then connect the
            proposal to {levers[1] || 'their documented policy priorities'} and show exactly how the
            commitment will be measured.
          </p>
        </BriefCard>

        <BriefCard title="Landmines to avoid" basis="Basis: opposition_triggers">
          <BulletList items={concerns} />
        </BriefCard>

        <BriefCard title="Likely questions" basis="Basis: issue_positions + district">
          <BulletList items={brief.questions} />
        </BriefCard>

        <BriefCard
          title="Likely objections"
          basis="Simulated language from opposition_triggers; not quotes."
        >
          <BulletList
            items={concerns}
            render={(x) =>
              `“I need the proposal to address ${x.charAt(0).toLowerCase() + x.slice(1)}.”`
            }
          />
        </BriefCard>

        <BriefCard title="What a “yes” requires" basis="Basis: persuasion_levers">
          <BulletList items={levers} />
        </BriefCard>

        <BriefCard
          title="Simulated opening response"
          className="md:col-span-2"
          basis={
            <>
              <SourceList citations={brief.citations} /> · Rehearsal language, not a verbatim quote.
            </>
          }
        >
          <blockquote className="rounded-xl border-l-2 border-gold bg-paper px-4 py-3.5 font-display text-base leading-snug text-navy italic">
            {brief.opening}
          </blockquote>
        </BriefCard>
      </div>

      {brief.gaps.length > 0 && (
        <Callout title="Data-gap warning">
          <BulletList items={brief.gaps} />
        </Callout>
      )}
    </div>
  );
}
