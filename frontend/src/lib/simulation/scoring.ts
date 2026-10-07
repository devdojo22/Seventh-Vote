import { ASK_DIRECTIONS, CATEGORY_LABELS, CATEGORY_TERMS } from '@/data/agenda';
import { rehearsalRules } from '@/data/rehearsal-rules';
import { STANCES } from '@/data/stances';
import { alignment, recordDepth } from '@/lib/members';
import type { Member } from '@/types/member';
import type {
  CategoryId,
  Citation,
  Confidence,
  Evidence,
  MemberRow,
  RehearsalRules,
  SessionInput,
  StanceLabel,
  StanceScore,
} from '@/types/simulation';

const POSITIVE_STANCE_TERMS = [
  'support',
  'champion',
  'favor',
  'invest',
  'pro-',
  'advocat',
  'priorit',
  'approve',
  'sponsor',
  'expand',
  'protect',
  'strong',
];
const NEGATIVE_STANCE_TERMS = [
  'oppos',
  'skeptic',
  'concern',
  'resist',
  'against',
  'moratorium',
  'restrict',
  'cautio',
  'scrutin',
  'abstain',
];

const MAX_CONCERNS = 3;
const MAX_LEVERS = 2;
const MAX_VOTE_CITATIONS = 2;

function findEvidence(member: Member, category: CategoryId): Evidence {
  const position = member.issue_positions[category] ?? null;
  const terms = CATEGORY_TERMS[category];
  const votes = member.key_votes.filter((v) => {
    const record = `${v.item} ${v.position}`.toLowerCase().replace(/-/g, ' ');
    return terms.some((t) => record.includes(t));
  });
  return { category, position, votes, count: (position ? 1 : 0) + votes.length };
}

/** Crude keyword sentiment in [-1, 1] over stance/evidence text. */
function stanceFromText(text: string): number {
  const lower = text.toLowerCase();
  const hits = (terms: string[]) => terms.filter((t) => lower.includes(t)).length;
  return Math.max(-1, Math.min(1, hits(POSITIVE_STANCE_TERMS) - hits(NEGATIVE_STANCE_TERMS)));
}

function stanceLabel(score: StanceScore): StanceLabel {
  return STANCES.find((s) => s.score === score)?.label ?? 'Undecided';
}

function clampScore(score: number): StanceScore {
  return Math.max(-2, Math.min(2, score)) as StanceScore;
}

function moratoriumFlags(member: Member, input: SessionInput, rules: RehearsalRules) {
  const agendaText = `${input.title} ${input.desc}`.toLowerCase();
  const isMoratorium = /data[- ]?center/.test(agendaText) && /moratorium/.test(agendaText);
  const { moratorium, loganMoratorium } = rules;

  const sponsor =
    isMoratorium &&
    moratorium.sponsorIds.includes(member.id) &&
    member.key_votes.some(
      (v) =>
        /data[- ]?center/.test(v.item.toLowerCase()) &&
        /moratorium/.test(v.item.toLowerCase()) &&
        /sponsor/.test(v.position.toLowerCase()),
    );
  const logan =
    isMoratorium &&
    member.id === loganMoratorium.memberId &&
    member.key_votes.some(
      (v) =>
        v.date === loganMoratorium.voteDate && loganMoratorium.positionPattern.test(v.position),
    );
  return { sponsor, logan };
}

function buildReason(
  member: Member,
  evidence: Evidence,
  underlyingScore: number,
  opposing: boolean,
  flags: { sponsor: boolean; logan: boolean },
  rules: RehearsalRules,
): string {
  const side = opposing ? 'oppose' : 'support';
  const cited = (evidence.position?.evidence || evidence.votes[0]?.item) ?? '';

  if (flags.sponsor) {
    const { lead, cosponsor } = rules.moratorium.sponsorReasons;
    const template = (member.id === rules.moratorium.leadSponsorId ? lead : cosponsor)[side];
    return template.replace('{name}', member.name);
  }
  if (flags.logan) return rules.loganMoratorium.reasons[side];

  if (opposing) {
    const lead =
      underlyingScore > 0
        ? 'The public record leans toward support for the underlying proposal, which weighs against an ask to oppose it.'
        : underlyingScore < 0
          ? 'The public record already leans against the underlying proposal, which aligns with an ask to oppose it.'
          : 'The public record does not show a clear position on the underlying proposal, so an ask to oppose it remains uncertain.';
    return `${lead} ${cited}`.trim();
  }
  if (rules.noDirectVoiceMemberIds.includes(member.id)) {
    return `No direct-quote voice simulation is available. The record-grounded posture centers on ${cited || 'the cited item'}.`;
  }
  return `My first test would be whether this delivers on ${member.persuasion_levers[0] || 'the stated public benefit'}. The public record points to ${cited}.`;
}

/**
 * Score one member against one agenda item, -2..+2. Deterministic: the row is
 * derived from the dossier and the session input only.
 */
export function scoreMember(
  member: Member,
  input: SessionInput,
  rules: RehearsalRules = rehearsalRules,
): MemberRow {
  const evidence = findEvidence(member, input.category);
  const base = {
    member,
    participation: input.attendance[member.id] ?? 'present',
    concerns: member.opposition_triggers.slice(0, MAX_CONCERNS),
    levers: member.persuasion_levers.slice(0, MAX_LEVERS),
    evidence,
  } as const;

  if (!evidence.count) {
    return {
      ...base,
      score: 0,
      stance: 'Undecided',
      confidence: 'Low',
      reason: 'No public record found on this category; the prototype will not infer a position.',
    };
  }

  let score = stanceFromText(
    `${evidence.position?.stance ?? ''} ${evidence.position?.evidence ?? ''}`,
  );
  const hasBudgetPosition = Boolean(member.issue_positions['budget_taxes']);
  const triggerText = member.opposition_triggers.join(' ').toLowerCase();
  if (
    input.fiscal === 'cost' &&
    (hasBudgetPosition || /tax|unfunded|spend|fiscal/.test(triggerText))
  ) {
    score--;
  }
  if (input.fiscal === 'revenue' && hasBudgetPosition) score++;
  if (input.priority === 'yes') {
    const posture = alignment(member);
    if (posture === 'ally') score++;
    if (posture === 'critic') score--;
  }
  if (input.impact === 'specific' && input.districts.includes(member.district)) score++;
  if (input.impact === 'super' && member.district.startsWith('Super')) score++;
  if (input.ask === 'Funding' && input.fiscal === 'cost') score--;

  const flags = moratoriumFlags(member, input, rules);
  if (flags.sponsor) score = 2;
  else if (flags.logan) score = 1;

  const finalScore = clampScore(score);

  let confidence: Confidence = evidence.count >= 2 ? 'High' : 'Medium';
  if (recordDepth(member).label === 'Thin' && confidence === 'High') confidence = 'Medium';
  if (flags.sponsor) confidence = 'High';
  if (flags.logan) confidence = 'Medium';

  return {
    ...base,
    score: finalScore,
    stance: stanceLabel(finalScore),
    confidence,
    reason: buildReason(
      member,
      evidence,
      score,
      ASK_DIRECTIONS[input.ask] === 'oppose',
      flags,
      rules,
    ),
  };
}

export function citations(row: MemberRow): Citation[] {
  const { position, votes, category } = row.evidence;
  const result: Citation[] = [];
  if (position) {
    result.push({
      id: `${row.member.id}-position-${category}`,
      name: position.source_name,
      url: position.source_url,
      label: `${CATEGORY_LABELS[category]} position`,
    });
  }
  votes
    .slice(0, MAX_VOTE_CITATIONS)
    .forEach((v) =>
      result.push({ id: v.id, name: v.source_name, url: v.source_url, label: v.date }),
    );
  return result;
}

/** Likely questions for a 1-on-1, from concerns and district. */
export function questions(row: MemberRow, input: SessionInput): string[] {
  const topic = CATEGORY_LABELS[input.category].toLowerCase();
  const [firstConcern] = row.concerns;
  return [
    `How is the public benefit of this ${topic} item measured and enforced?`,
    firstConcern
      ? `How does the proposal address this concern: ${firstConcern}?`
      : 'What evidence supports the projected impact?',
    row.member.district.startsWith('Super')
      ? 'What is the citywide distribution of benefits and costs?'
      : `What specifically changes for ${row.member.district}?`,
  ];
}
