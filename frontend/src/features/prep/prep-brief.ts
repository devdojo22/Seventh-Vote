import { CATEGORY_LABELS } from '@/data/agenda';
import {
  AGENDA_LIMITS,
  type SimulationAgenda,
  type SimulationAnswer,
} from '@/features/simulation/simulation-api';
import type { Member, MemberId } from '@/types/member';
import type { Ask, CategoryId, SessionInput } from '@/types/simulation';

export const MAX_DATA_GAPS = 3;

export interface PrepValues {
  memberId: MemberId;
  category: CategoryId;
  ask: Ask;
  pitch: string;
}

export interface PrepBrief {
  member: Member;
  answer: SimulationAnswer;
}

function pitchTitle(pitch: string): string {
  const max = AGENDA_LIMITS.title;
  if (pitch.length <= max) return pitch;
  const cut = pitch.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export function prepAgenda(
  values: PrepValues,
  sessionContext: SessionInput | null,
): SimulationAgenda {
  const pitch = values.pitch.trim();
  const title =
    sessionContext && pitch === sessionContext.desc.trim()
      ? sessionContext.title
      : pitchTitle(pitch);
  return {
    title,
    description: pitch,
    category: CATEGORY_LABELS[values.category],
    ask: values.ask,
  };
}
