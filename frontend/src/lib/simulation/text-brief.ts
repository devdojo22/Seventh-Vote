import { CATEGORY_LABELS } from '@/data/agenda';
import type { SessionAnalysis, SessionInput } from '@/types/simulation';

function outcomeLine(analysis: SessionAnalysis): string {
  const { threshold, direction, goalCount, target, outcome } = analysis;
  if (outcome === 'consent') return threshold.note;
  if (outcome === 'unreachable') return 'No members present: nothing can be voted on.';
  const label = direction === 'oppose' ? 'Projected leaning to oppose' : 'Projected leaning-yes';
  return `${label}: ${goalCount}/${threshold.denominator} (${target} needed) · ${threshold.note}`;
}

function pivotalLine(analysis: SessionAnalysis): string {
  const { outcome, pivot, target } = analysis;
  if (outcome === 'consent') {
    return 'Consent lens: any one member may object and pull the item for normal handling.';
  }
  if (!pivot.candidates.length) {
    return 'Pivotal members: none — no single member changes the projected result.';
  }
  const role =
    pivot.mode === 'reach' ? `can supply vote ${target}` : 'protect the threshold coalition';
  const names = pivot.candidates.map((c) => `${c.row.member.name} [priority ${c.priority}]`);
  return `Pivotal members (${role}): ${names.join(', ')}`;
}

/** Plain-text rehearsal brief for download. */
export function textBrief(analysis: SessionAnalysis, input: SessionInput): string {
  const { rows, voting, rule } = analysis;
  return [
    'SEVENTH VOTE — REHEARSAL BRIEF',
    input.title,
    `${CATEGORY_LABELS[input.category]} · ${rule.label} · ${input.ask}`,
    `Committee: ${input.committee || 'Not entered'} · Chair: ${input.committeeChair || 'Not entered'}`,
    outcomeLine(analysis),
    `Attendance: ${voting.length} present · ${rows.length - voting.length} absent or recused`,
    pivotalLine(analysis),
    '',
    'ONE-SHOT STAKES: once finally approved or rejected, the item cannot return for six months (Rule 39b).',
    '',
    'HYPOTHESIS, NOT PREDICTION. Verify citations and speak with council members directly.',
    '',
    ...rows.map((r) => {
      const status =
        r.participation === 'present' ? r.confidence : `${r.participation}; not counted`;
      return `${r.member.name} — ${r.stance} (${status})\n${r.reason}\nMove with: ${r.levers.join('; ')}\nWatch: ${r.concerns.join('; ')}\n`;
    }),
  ].join('\n');
}
