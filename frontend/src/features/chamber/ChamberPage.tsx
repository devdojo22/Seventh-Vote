import { HeaderStat, PageHeader } from '@/components/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { councilOfficers } from '@/lib/members';
import { useAppStore } from '@/stores/app-store';
import { useCouncilStore } from '@/stores/council-store';
import { MemberCard } from './MemberCard';

export function ChamberPage() {
  const members = useCouncilStore((s) => s.members);
  const config = useCouncilStore((s) => s.config);
  const openMember = useAppStore((s) => s.openMember);
  const officers = councilOfficers(members, config.leadershipFallback);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Council Chamber"
        title={`${config.councilName}, at a glance`}
        description="Explore the public record behind each digital twin, then test an agenda item against the full chamber."
        aside={<HeaderStat value={config.termLabel} label="current council term" />}
      />

      <div className="relative grid grid-cols-1 overflow-hidden rounded-2xl bg-navy text-white shadow-elevated sm:grid-cols-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(200_155_60/0.22),transparent_55%)]"
        />
        {officers.map((officer) => (
          <div
            className="relative border-white/10 p-5 not-last:border-b sm:p-6 sm:not-last:border-r sm:not-last:border-b-0"
            key={officer.title}
          >
            <small className="mb-1.5 block text-[11px] font-bold tracking-[0.14em] text-gold2 uppercase">
              {officer.title}
            </small>
            <strong className="block font-display text-xl leading-tight font-semibold sm:text-[22px]">
              {officer.name}
            </strong>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <SectionHeading
          title={`${members.length} seats`}
          note="District order · Select a member for full record"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} onOpen={openMember} />
          ))}
        </div>
      </div>
    </section>
  );
}
