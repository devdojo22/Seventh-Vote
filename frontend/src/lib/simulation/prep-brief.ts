import { rehearsalRules } from '@/data/rehearsal-rules';
import { SESSION_DEFAULTS } from '@/data/session-defaults';
import type { Member, MemberId } from '@/types/member';
import type {
  Ask,
  CategoryId,
  Citation,
  Confidence,
  SessionInput,
  StanceLabel,
} from '@/types/simulation';
import { citations, questions, scoreMember } from './scoring';

const MAX_GAPS = 3;

export interface PrepValues {
  memberId: MemberId;
  category: CategoryId;
  ask: Ask;
  pitch: string;
}

export interface PrepBrief {
  member: Member;
  stance: StanceLabel;
  confidence: Confidence;
  concerns: string[];
  levers: string[];
  questions: string[];
  gaps: string[];
  citations: Citation[];
  opening: string;
}

/**
 * Session input for a 1-on-1 brief. With a loaded session context the brief
 * shares its fiscal, priority, impact, district and attendance settings, so a
 * member's prep read matches their session read for the same item.
 */
export function prepInput(values: PrepValues, sessionContext: SessionInput | null): SessionInput {
  const pitch = values.pitch.trim();
  if (!sessionContext) {
    return {
      ...SESSION_DEFAULTS,
      title: pitch,
      desc: pitch,
      category: values.category,
      ask: values.ask,
      districts: [],
      attendance: {},
    };
  }
  return {
    ...sessionContext,
    title: pitch === sessionContext.desc ? sessionContext.title : pitch,
    desc: pitch,
    category: values.category,
    ask: values.ask,
  };
}

export function buildPrepBrief(member: Member, input: SessionInput): PrepBrief {
  const row = scoreMember(member, input);
  const opening = rehearsalRules.noDirectVoiceMemberIds.includes(member.id)
    ? `A direct-voice opening is withheld because no verified verbatim 2024–26 quotes were found. Record-grounded posture: ${row.reason}`
    : `“${row.reason}”`;
  return {
    member,
    stance: row.stance,
    confidence: row.confidence,
    concerns: row.concerns,
    levers: row.levers,
    questions: questions(row, input),
    gaps: member.data_gaps.slice(0, MAX_GAPS),
    citations: citations(row),
    opening,
  };
}
