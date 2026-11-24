import { PageHeader } from '@/components/PageHeader';
import { SourceLink } from '@/components/SourceLink';
import { BulletList } from '@/components/ui/BulletList';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { METHODOLOGY } from '@/data/methodology';
import { buildSourceCloud } from '@/lib/members';
import { findRule } from '@/lib/simulation/thresholds';
import { useCouncilStore } from '@/stores/council-store';
import type { ActionRule } from '@/types/simulation';

const PANEL_TITLE_CLASS = 'font-display text-xl font-bold text-navy';

export function MethodologyPage() {
  const members = useCouncilStore((s) => s.members);
  const rules = useCouncilStore((s) => s.rules);
  const snapshot = useCouncilStore((s) => s.snapshot);
  const { seatCount, rulesOfProcedure, research } = useCouncilStore((s) => s.config);

  const cloud = buildSourceCloud(members, rulesOfProcedure);
  // The rules come from the workspace's saved vote rules, so describe whichever action types it has.
  const ordinary = findRule(rules, 'ordinary');
  const ordinaryNeeded = ordinary.basis === 'full' ? ordinary.needed : 0;
  const describe = (rule: ActionRule) => {
    if (rule.basis === 'full') return `${rule.label} requires ${rule.needed} of ${seatCount}`;
    if (rule.basis === 'present' && rule.fraction) {
      return `${rule.label} needs ${rule.fraction.numerator}/${rule.fraction.denominator} of members present`;
    }
    return `${rule.label} uses a majority of members present`;
  };
  const others = rules.filter((r) => r.id !== 'ordinary' && r.basis !== 'consent');

  const thresholdLimits = [
    snapshot && !ordinary.verified
      ? `The ordinary ${ordinaryNeeded}-vote default is an unverified working inference because ordinary passage is Charter-governed, not stated in the Rules.`
      : `Ordinary items need ${ordinaryNeeded} of ${seatCount}${ordinary.verified ? ', from this workspace’s vote rules' : ', a working inference until this workspace’s vote rules are set'}.`,
    ...(others.length > 0 ? [`Rules-aware thresholds: ${others.map(describe).join('; ')}.`] : []),
  ];

  const limits = [
    ...thresholdLimits,
    METHODOLOGY.consentLimit,
    ...METHODOLOGY.limits,
    ...research.sourceCaveats,
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
              applies{' '}
              {rulesOfProcedure
                ? 'the published Rules of Procedure'
                : 'this workspace’s vote rules'}{' '}
              to the selected item type. It does not ingest live agendas or full transcripts, and it
              contains no private notes or interviews.
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
          {research.knownLimitations && (
            <Callout title="Known limitations.">{research.knownLimitations}</Callout>
          )}
        </Card>
      </div>
    </section>
  );
}
