import { rehearsalRules } from '@/data/rehearsal-rules';
import { isHttpUrl } from '@/lib/url';
import type { CouncilConfig, CouncilOfficer } from '@/types/council';
import type { Member, PoliticalStyle, TwinVoice } from '@/types/member';
import type { Citation } from '@/types/simulation';

export type MayorPosture = 'ally' | 'independent' | 'critic';
export type RecordDepthLabel = 'Strong' | 'Moderate' | 'Thin';

const THIN_RECORD_PENALTY = 3;
const MAX_DOSSIER_SOURCES = 15;
const NO_LEADERSHIP_ROLE = /^\s*none/i;
const NOT_A_COUNCIL_OFFICE = /committee|emeritus|\b(former|past|ex|elect|outgoing|incoming|not)\b/i;

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => !['Sr.', 'Jr.'].includes(part))
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

export function alignment(member: Member): MayorPosture {
  const raw = member.mayor_alignment;
  const text = (typeof raw === 'string' ? raw : (raw.relationship ?? '')).toLowerCase().trim();
  if (/^(ally|cooperative)/.test(text)) return 'ally';
  if (/^(critic|oppos|skeptic|adversar)/.test(text)) return 'critic';
  return 'independent';
}

export function postureLabel(posture: MayorPosture): string {
  return posture === 'ally' ? 'Cooperative' : posture === 'critic' ? 'Skeptical' : 'Independent';
}

export const POSTURE_CLASSES: Record<MayorPosture, string> = {
  ally: 'bg-pine-bg text-pine',
  critic: 'bg-brick-bg text-brick',
  independent: 'bg-steel-bg text-steel',
};

export function recordDepth(member: Member): { label: RecordDepthLabel; percent: number } {
  let score =
    member.key_votes.length +
    Object.keys(member.issue_positions).length * 2 +
    member.notable_quotes.filter((q) => isHttpUrl(q.source_url)).length;
  if (rehearsalRules.thinRecordMemberIds.includes(member.id)) score -= THIN_RECORD_PENALTY;
  if (score >= 16) return { label: 'Strong', percent: 90 };
  if (score >= 11) return { label: 'Moderate', percent: 62 };
  return { label: 'Thin', percent: 34 };
}

/** Short role line for a member card: leadership role, else top committee chairmanship. */
export function primaryRole(member: Member): string {
  if (!NO_LEADERSHIP_ROLE.test(member.leadership_role)) return member.leadership_role;
  const chaired = Object.entries(member.committees).find(([, role]) => /chair/i.test(role));
  return chaired ? `${chaired[1]} · ${chaired[0]}` : 'Council member';
}

export function sinceYear(tookOffice: string): string {
  return tookOffice.match(/\d{4}/)?.[0] ?? tookOffice;
}

export function fieldText(value: string | PoliticalStyle | TwinVoice): string {
  if (typeof value === 'string') return value;
  return 'description' in value ? value.description : value.style;
}


function councilOffice(role: string): 'chair' | 'viceChair' | null {
  if (NO_LEADERSHIP_ROLE.test(role)) return null;
  const title = role.split(/[(;—–]|\s-\s/)[0] ?? '';
  if (NOT_A_COUNCIL_OFFICE.test(title)) return null;
  if (/\bvice[-\s]?chair(man|woman|person)?\b/i.test(title)) return 'viceChair';
  return /\bchair(man|woman|person)?\b/i.test(title) ? 'chair' : null;
}


export function councilOfficers(
  members: Member[],
  fallback: CouncilConfig['leadershipFallback'],
): CouncilOfficer[] {
  const named = {
    chair: members.find((m) => councilOffice(m.leadership_role) === 'chair'),
    viceChair: members.find((m) => councilOffice(m.leadership_role) === 'viceChair'),
    chairEmeritus: members.find((m) => /chair emeritus/i.test(m.leadership_role)),
  };
  if (!fallback) {
    return [
      named.chair && { title: 'Chair', name: named.chair.name },
      named.viceChair && { title: 'Vice Chair', name: named.viceChair.name },
      named.chairEmeritus && { title: 'Chair Emeritus', name: named.chairEmeritus.name },
    ].filter((officer) => officer !== undefined);
  }
  return [
    { title: fallback.chair.title, name: named.chair?.name ?? fallback.chair.name },
    { title: fallback.viceChair.title, name: named.viceChair?.name ?? fallback.viceChair.name },
    {
      title: fallback.chairEmeritus.title,
      name: named.chairEmeritus?.name ?? fallback.chairEmeritus.name,
    },
  ];
}

export function buildSourceCloud(members: Member[], rulesOfProcedure: Citation | null): Citation[] {
  const seen = new Map<string, string>();
  const add = (name: string, url: string) => {
    if (isHttpUrl(url) && !seen.has(name)) seen.set(name, url);
  };
  for (const m of members) {
    m.key_votes.forEach((v) => add(v.source_name, v.source_url));
    Object.values(m.issue_positions).forEach((p) => add(p.source_name, p.source_url));
    m.notable_quotes.forEach((q) => add(q.source_name, q.source_url));
  }
  const dossier = [...seen].slice(0, MAX_DOSSIER_SOURCES).map(([name, url]) => ({
    id: name,
    name,
    url,
    label: name,
  }));
  return rulesOfProcedure ? [rulesOfProcedure, ...dossier] : dossier;
}
