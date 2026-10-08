import { PageHeader } from '@/components/PageHeader';
import { SourceLink } from '@/components/SourceLink';
import { BulletList } from '@/components/ui/BulletList';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { METHODOLOGY } from '@/data/methodology';
import { rehearsalRules } from '@/data/rehearsal-rules';
import { buildSourceCloud } from '@/lib/members';
import { findRule } from '@/lib/simulation/thresholds';
import { useCouncilStore } from '@/stores/council-store';

const PANEL_TITLE_CLASS = 'font-display text-xl font-bold text-navy';

export function MethodologyPage() {
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

  const limits = [
    `Rules-aware thresholds: censure requires ${needed('censure')} of ${seatCount}; Rules amendments require ${needed('rules_amendment')} of ${seatCount}; listed procedural motions use a majority of members present.`,
    `The ordinary ${needed('ordinary')}-vote default is an unverified working inference because ordinary passage is Charter-governed, not stated in the Rules.`,
    METHODOLOGY.consentLimit,
    ...METHODOLOGY.limits,
    ...(noDirectVoice
      ? [
          `${noDirectVoice} receives no invented direct voice because no verified verbatim 2024–26 quotes were found.`,
        ]
      : []),
  ];

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Methodology"
        title="Evidence before imitation"
        description="Every result is a traceable hypothesis built from a dated public-record dossier — not a claim to know how a member will vote."
      />

      <Card className="border-l-4 border-l-gold">
        <p className="text-sm leading-relaxed text-ink/80 sm:text-[15px]">{METHODOLOGY.intro}</p>
      </Card>

      <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {METHODOLOGY.steps.map((step, i) => (
          <li
            key={step.id}
            className="relative space-y-2 overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-navy font-display text-sm font-bold text-gold2">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="pt-2 font-display text-lg font-bold text-navy">{step.title}</h3>
            <p className="text-[13px] leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="space-y-6">
          <div className="space-y-3">
            <h2 className={PANEL_TITLE_CLASS}>What this prototype does — and does not</h2>
            <p className="text-[13px] leading-relaxed text-ink/80">
              It reasons over researched public-record dossiers for all {members.length} members and
              applies the published Rules of Procedure to the selected item type. It does not ingest
              live agendas or full transcripts, and it contains no private notes or interviews.
            </p>
            <BulletList items={limits} className="text-[13px] leading-relaxed text-ink/80" />
          </div>

          <div className="space-y-3 border-t border-line2 pt-5">
            <h2 className={PANEL_TITLE_CLASS}>Research sources</h2>
            <ul className="flex flex-wrap gap-2 text-xs">
              {cloud.map((c) => (
                <li key={c.id} className="rounded-full border border-line bg-paper px-3 py-1.5">
                  <SourceLink name={c.name} url={c.url} label={c.label} />
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="space-y-5">
          <h2 className={PANEL_TITLE_CLASS}>Roadmap</h2>
          <ol className="relative space-y-3">
            {METHODOLOGY.roadmap.map((item, i) => (
              <li key={item.id} className="flex gap-3.5 rounded-xl bg-paper p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-white text-xs font-bold text-navy">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold text-navy">{item.title}</strong>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <Callout title="Known limitations.">{METHODOLOGY.knownLimitations}</Callout>
        </Card>
      </div>
    </section>
  );
}
