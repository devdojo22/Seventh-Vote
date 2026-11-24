// Test data builders shared by the unit tests (Vitest). Not imported by the app.
import type { SimulationAnswer } from '@/features/simulation/simulation-api';
import type { Member } from '@/types/member';
import type { StanceLabel } from '@/types/simulation';

export interface Evidence {
  votes?: number;
  positions?: number;
  sourcedQuotes?: number;
  unsourcedQuotes?: number;
}

/** A member with a given amount of evidence; everything else is neutral. */
export function makeMember(
  id: string,
  { votes = 0, positions = 0, sourcedQuotes = 0, unsourcedQuotes = 0 }: Evidence = {},
  overrides: Partial<Member> = {},
): Member {
  return {
    id,
    name: `Member ${id}`,
    district: `District ${id}`,
    took_office: '2024',
    leadership_role: 'None',
    bio: '',
    voting_bloc: '',
    committees: {},
    issue_positions: Object.fromEntries(
      Array.from({ length: positions }, (_, i) => [
        `topic_${String(i)}`,
        {
          stance: 'Support',
          evidence: 'Record',
          source_name: 'Minutes',
          source_url: 'https://example.com',
        },
      ]),
    ),
    key_votes: Array.from({ length: votes }, (_, i) => ({
      id: `${id}-vote-${String(i)}`,
      date: '2025-01-01',
      item: 'Item',
      position: 'Yes',
      source_name: 'Minutes',
      source_url: 'https://example.com',
    })),
    notable_quotes: [
      ...Array.from({ length: sourcedQuotes }, (_, i) => ({
        id: `${id}-q-${String(i)}`,
        quote: 'Quote',
        source_name: 'Video',
        source_url: 'https://example.com/video',
      })),
      ...Array.from({ length: unsourcedQuotes }, (_, i) => ({
        id: `${id}-uq-${String(i)}`,
        quote: 'Quote',
        source_name: 'Unknown',
        source_url: 'unverified',
      })),
    ],
    opposition_triggers: [],
    persuasion_levers: [],
    data_gaps: [],
    mayor_alignment: 'Independent',
    political_style: '',
    twin_voice: '',
    basis: 'approved',
    version_no: 1,
    ...overrides,
  };
}

export function makeAnswer(member: Member, stance: StanceLabel): SimulationAnswer {
  return {
    memberId: '00000000-0000-4000-8000-000000000000',
    memberName: member.name,
    memberSlug: member.id,
    dossierVersionId: '00000000-0000-4000-8000-000000000001',
    versionNo: member.version_no,
    stance,
    confidence: 'Medium',
    answer: 'Answer',
    reasoning: 'Reasoning',
    concerns: [],
    levers: [],
    questions: [],
    citations: [],
  };
}
