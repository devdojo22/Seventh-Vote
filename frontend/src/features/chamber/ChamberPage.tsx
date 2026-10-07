import { Disclaimer } from '@/components/Disclaimer';
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
    <section className="animate-fade-in space-y-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="max-w-[760px] font-display text-[30px] leading-[1.05] font-semibold tracking-tight text-navy sm:text-[38px] lg:text-[48px]">
            {config.councilName}, at a glance
          </h1>
          <p className="mt-2.5 max-w-[760px] text-[14px] text-muted sm:text-[15px]">
            Explore the public record behind each digital twin, then test an agenda item against the
            full chamber.
          </p>
        </div>
        <div className="hidden min-w-[140px] shrink-0 text-right sm:block">
          <strong className="block font-display text-[30px] leading-none text-navy sm:text-[32px]">
            {config.termLabel}
          </strong>
          <span className="mt-1 block text-[12px] text-muted">current council term</span>
        </div>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-xl bg-navy text-white shadow-sm sm:grid-cols-3">
        {officers.map((officer, i) => (
          <div
            className={`p-4.5 sm:p-5 ${
              i < officers.length - 1 ? 'border-b border-white/14 sm:border-r sm:border-b-0' : ''
            }`}
            key={officer.title}
          >
            <small className="mb-1 block text-[11px] font-bold tracking-wider text-gold2 uppercase">
              {officer.title}
            </small>
            <strong className="block font-display text-[19px] leading-tight font-semibold sm:text-[21px]">
              {officer.name}
            </strong>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <h2 className="font-display text-[20px] font-medium text-navy sm:text-[24px]">
          {members.length} seats
        </h2>
        <span className="text-[12px] text-muted">
          District order · Select a member for full record
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} onOpen={openMember} />
        ))}
      </div>

      <Disclaimer />
    </section>
  );
}
