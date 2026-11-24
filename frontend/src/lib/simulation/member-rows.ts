import { STANCES } from '@/data/stances';
import { answerMemberId, type SimulationAnswer } from '@/features/simulation/simulation-api';
import type { Member, MemberId } from '@/types/member';
import type {
  AttendanceStatus,
  MemberRow,
  PresentMemberRow,
  StanceLabel,
  StanceScore,
} from '@/types/simulation';

export function hasNoDirectEvidence(row: PresentMemberRow): boolean {
  return row.stance === 'Undecided' && row.confidence === 'Low';
}

export function participationOf(
  memberId: MemberId,
  attendance: Readonly<Record<MemberId, AttendanceStatus>>,
): AttendanceStatus {
  return attendance[memberId] ?? 'present';
}

export function presentMemberIds(
  members: readonly Member[],
  attendance: Readonly<Record<MemberId, AttendanceStatus>>,
): MemberId[] {
  return members.filter((m) => participationOf(m.id, attendance) === 'present').map((m) => m.id);
}

export function stanceScore(stance: StanceLabel): StanceScore {
  const definition = STANCES.find((s) => s.label === stance);
  if (!definition) throw new Error(`Unknown stance: ${stance}`);
  return definition.score;
}

export function buildRows(
  members: readonly Member[],
  attendance: Readonly<Record<MemberId, AttendanceStatus>>,
  answers: readonly SimulationAnswer[],
): MemberRow[] {
  const answerByMember = new Map(answers.map((a) => [answerMemberId(a), a]));
  return members.map((member): MemberRow => {
    const participation = participationOf(member.id, attendance);
    if (participation !== 'present') {
      return { member, participation, stance: null, score: 0, confidence: null, answer: null };
    }
    const answer = answerByMember.get(member.id);
    if (!answer) throw new Error(`No simulated answer for ${member.name}`);
    return {
      member,
      participation,
      stance: answer.stance,
      score: stanceScore(answer.stance),
      confidence: answer.confidence,
      answer,
    };
  });
}
