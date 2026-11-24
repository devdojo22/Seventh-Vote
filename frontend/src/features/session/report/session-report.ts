import { CATEGORY_LABELS } from '@/data/agenda';
import { FISCAL_OPTIONS, IMPACT_OPTIONS, PRIORITY_OPTIONS } from '@/data/form-options';
import { optionLabel } from '@/lib/options';
import type { SimulationAnswer } from '@/features/simulation/simulation-api';
import { UNREVIEWED_EXPLANATION, unreviewedSummary } from '@/lib/members';
import { movability } from '@/lib/simulation/pivotal';
import {
  evidenceGapNote,
  outcomeHeadline,
  outcomeText,
  outreachNote,
  pivotalCopy,
  thresholdExplanation,
  thresholdFigure,
} from '@/lib/simulation/session-summary';
import type { CouncilConfig } from '@/types/council';
import type {
  AttendanceStatus,
  SessionAnalysis,
  SessionInput,
  StanceLabel,
  TallySegment,
} from '@/types/simulation';

export const REPORT_DISCLAIMER =
  'Hypothesis, not prediction. Each member’s read is simulated by AI from the evidence in their dossier. Verify citations and speak with council members directly.';

const NOT_ENTERED = 'Not entered';

export interface ReportNotice {
  title: string;
  body: string;
}

export interface ReportMember {
  name: string;
  district: string;
  participation: AttendanceStatus;
  unreviewed: boolean;
  answer: SimulationAnswer | null;
}

export interface ReportPivotalMember {
  name: string;
  district: string;
  stance: StanceLabel;
  priority: number;
  lever: string | null;
}

export interface ReportOutreach {
  name: string;
  stance: StanceLabel;
  priority: number;
  levers: string[];
  avoid: string | null;
  citationLabels: string[];
}

export interface SessionReport {
  generatedAt: Date;
  councilName: string;
  title: string;
  description: string;
  meta: string;
  details: { label: string; value: string }[];
  figure: { figure: string; caption: string };
  attendance: { present: number; absent: number; recused: number };
  outcome: { headline: string; detail: string | null; tone: 'positive' | 'negative' | 'neutral' };
  threshold: { label: string; note: string };
  notices: ReportNotice[];
  consent: boolean;
  tally: TallySegment[];
  pivotal: {
    title: string;
    desc: string;
    action: string;
    members: ReportPivotalMember[];
  } | null;
  objectors: { name: string; stance: StanceLabel; concern: string | null }[];
  outreach: { note: string; members: ReportOutreach[] };
  members: ReportMember[];
  disclaimer: string;
}

function details(input: SessionInput, ruleLabel: string): SessionReport['details'] {
  const impact = optionLabel(IMPACT_OPTIONS, input.impact);
  return [
    { label: 'Category', value: CATEGORY_LABELS[input.category] },
    { label: 'Action type', value: ruleLabel },
    { label: 'The ask', value: input.ask },
    { label: 'Committee referral', value: input.committee || NOT_ENTERED },
    { label: 'Committee chair', value: input.committeeChair || NOT_ENTERED },
    { label: 'Fiscal impact', value: optionLabel(FISCAL_OPTIONS, input.fiscal) },
    { label: 'Mayor’s priority', value: optionLabel(PRIORITY_OPTIONS, input.priority) },
    {
      label: 'District impact',
      value: input.impact === 'specific' ? `${impact}: ${input.districts.join(', ')}` : impact,
    },
  ];
}

export function buildSessionReport(
  analysis: SessionAnalysis,
  input: SessionInput,
  config: CouncilConfig,
  generatedAt: Date,
): SessionReport {
  const { rows, rule, threshold, outcome, direction } = analysis;
  const consent = outcome === 'consent';
  const count = (status: AttendanceStatus) => rows.filter((r) => r.participation === status).length;

  const unreviewed = unreviewedSummary(rows.map((r) => r.member));
  const gapNote = evidenceGapNote(analysis);
  const notices: ReportNotice[] = [
    ...(gapNote ? [gapNote] : []),
    { title: threshold.note, body: thresholdExplanation(analysis) },
    ...(config.procedure.oneShotStakes ? [config.procedure.oneShotStakes] : []),
    ...(unreviewed ? [{ title: unreviewed, body: UNREVIEWED_EXPLANATION }] : []),
  ];

  const pivotal = consent
    ? null
    : (() => {
        const { title, desc, action } = pivotalCopy(analysis);
        return {
          title,
          desc,
          action,
          members: analysis.pivot.candidates.map(({ row, priority }) => ({
            name: row.member.name,
            district: row.member.district,
            stance: row.stance,
            priority,
            lever: row.answer.levers[0] ?? null,
          })),
        };
      })();

  return {
    generatedAt,
    councilName: config.councilName,
    title: input.title,
    description: input.desc,
    meta: `${CATEGORY_LABELS[input.category]} · ${rule.label} · ${input.ask}`,
    details: details(input, rule.label),
    figure: thresholdFigure(analysis),
    attendance: { present: count('present'), absent: count('absent'), recused: count('recused') },
    outcome: consent
      ? { headline: 'Consent item', detail: config.procedure.consentNote, tone: 'neutral' }
      : {
          headline: outcomeHeadline(analysis),
          detail: outcome === 'unreachable' ? null : outcomeText(analysis),
          tone: analysis.evidenceGap.decisive
            ? 'neutral'
            : outcome === 'met'
              ? 'positive'
              : 'negative',
        },
    threshold: { label: threshold.label, note: threshold.note },
    notices,
    consent,
    tally: analysis.tally,
    pivotal,
    objectors: analysis.consentObjectors.map((row) => ({
      name: row.member.name,
      stance: row.stance,
      concern: row.answer.concerns[0] ?? null,
    })),
    outreach: {
      note: outreachNote(analysis),
      members: analysis.lobby.map((row) => ({
        name: row.member.name,
        stance: row.stance,
        priority: movability(row, direction),
        levers: row.answer.levers,
        avoid: row.answer.concerns[0] ?? null,
        citationLabels: row.answer.citations.map((c) => c.label),
      })),
    },
    members: rows.map((row) => ({
      name: row.member.name,
      district: row.member.district,
      participation: row.participation,
      unreviewed: row.member.basis === 'unreviewed',
      answer: row.answer,
    })),
    disclaimer: REPORT_DISCLAIMER,
  };
}

export function reportFileName(report: Pick<SessionReport, 'title' | 'generatedAt'>): string {
  const slug = report.title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  const day = [
    report.generatedAt.getFullYear(),
    String(report.generatedAt.getMonth() + 1).padStart(2, '0'),
    String(report.generatedAt.getDate()).padStart(2, '0'),
  ].join('-');
  return `seventh-vote-${slug || 'session'}-${day}.pdf`;
}
