import { Disclaimer } from '@/components/Disclaimer';
import { PageHeader } from '@/components/PageHeader';
import { SourceLink } from '@/components/SourceLink';
import { METHODOLOGY } from '@/data/methodology';
import { rehearsalRules } from '@/data/rehearsal-rules';
import { buildSourceCloud } from '@/lib/members';
import { findRule } from '@/lib/simulation/thresholds';
import { useCouncilStore } from '@/stores/council-store';

const PANEL_CLASS = 'rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6 lg:p-8';

export function MethodPage() {
  const members = useCouncilStore((s) => s.members);
  const membersById = useCouncilStore((s) => s.membersById);
  const rules = useCouncilStore((s) => s.rules);
  const { seatCount, rulesOfProcedure } = useCouncilStore((s) => s.config);

  const cloud = buildSourceCloud(members, rulesOfProcedure);
  const needed = (id: 'censure' | 'rules_amendment' | 'ordinary') => {
    const rule = findRule(rules, id);
    return rule.basis === 'full' ? rule.needed : 0;
  };
  const noDirectVoice = rehearsalRules.noDirectVoiceMemberIds
    .map((id) => membersById[id]?.name)
    .filter(Boolean)
    .join(' and ');

  return (
    <section className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <PageHeader
        title="Evidence before imitation"
        description="Every result is a traceable hypothesis built from a dated public-record dossier — not a claim to know how a member will vote."
      />

      <p className="rounded-2xl border border-line bg-white p-4 font-sans text-sm leading-relaxed text-navy/80 shadow-sm sm:p-6 sm:text-base">
        {METHODOLOGY.intro}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        {METHODOLOGY.steps.map((step, i) => (
          <div
            key={step.id}
            className="relative space-y-2 overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="absolute top-3 right-4 font-display text-3xl font-bold text-gold/30 select-none sm:text-4xl">
              {String(i + 1).padStart(2, '0')}
            </div>
            <h3 className="pr-12 font-display text-base font-bold text-navy sm:text-lg">
              {step.title}
            </h3>
            <p className="font-sans text-xs leading-relaxed text-navy/70 sm:text-sm">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
        <div className={`${PANEL_CLASS} space-y-5`}>
          <h2 className="border-b border-line/60 pb-2 font-display text-lg font-bold text-navy sm:text-xl">
            What this prototype does — and does not
          </h2>
          <p className="font-sans text-xs leading-relaxed text-navy/80 sm:text-sm">
            It reasons over researched public-record dossiers for all {members.length} members and
            applies the published Rules of Procedure to the selected item type. It does not ingest
            live agendas or full transcripts, and it contains no private notes or interviews.
          </p>
          <ul className="list-inside list-disc space-y-2 font-sans text-xs leading-relaxed text-navy/80 sm:text-sm">
            <li>
              Rules-aware thresholds: censure requires {needed('censure')} of {seatCount}; Rules
              amendments require {needed('rules_amendment')} of {seatCount}; listed procedural
              motions use a majority of members present.
            </li>
            <li>
              The ordinary {needed('ordinary')}-vote default is an unverified working inference
              because ordinary passage is Charter-governed, not stated in the Rules.
            </li>
            <li>{METHODOLOGY.consentLimit}</li>
            {METHODOLOGY.limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
            {noDirectVoice && (
              <li>
                {noDirectVoice} receives no invented direct voice because no verified verbatim
                2024–26 quotes were found.
              </li>
            )}
          </ul>

          <div className="border-t border-line/60 pt-4">
            <h2 className="mb-3 font-display text-lg font-bold text-navy sm:text-xl">
              Research sources
            </h2>
            <div className="flex flex-wrap gap-2">
              {cloud.map((c) => (
                <SourceLink key={c.id} name={c.name} url={c.url} label={c.label} />
              ))}
            </div>
          </div>
        </div>

        <div className={`${PANEL_CLASS} space-y-5`}>
          <h2 className="border-b border-line/60 pb-2 font-display text-lg font-bold text-navy sm:text-xl">
            Roadmap
          </h2>
          <ol className="space-y-3.5 font-sans text-xs text-navy sm:text-sm">
            {METHODOLOGY.roadmap.map((item, i) => (
              <li key={item.id} className="rounded-xl border border-line/60 bg-paper/30 p-3.5">
                <strong className="block text-sm font-bold text-navy">
                  {i + 1}. {item.title}
                </strong>
                <span className="mt-0.5 block leading-relaxed text-navy/70">{item.body}</span>
              </li>
            ))}
          </ol>
          <div className="space-y-1 rounded-xl border border-gold/40 bg-amber-bg/80 p-4 font-sans text-xs text-navy">
            <strong className="block font-semibold tracking-wider text-navy uppercase">
              Known limitations.
            </strong>
            <span className="block leading-relaxed text-navy/80">
              {METHODOLOGY.knownLimitations}
            </span>
          </div>
        </div>
      </div>

      <Disclaimer />
    </section>
  );
}
