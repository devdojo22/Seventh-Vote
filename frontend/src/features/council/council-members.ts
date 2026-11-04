import { getWorkspaceSettings } from '@/features/access/access-api';
import {
  getDossier,
  listDossiers,
  type DossierDetail,
  type KeyRecord,
} from '@/features/dossiers/dossier-api';
import { RECORD_OUTCOME_LABELS } from '@/data/dossier-options';
import { councilProfile, type CouncilProfile, type WorkspaceInfo } from '@/lib/council-profile';
import type { Member } from '@/types/member';


function recordDateText(record: KeyRecord): string {
  if (record.dateText) return record.dateText;
  if (!record.date) return '';
  if (record.datePrecision === 'year') return record.date.slice(0, 4);
  if (record.datePrecision === 'month') return record.date.slice(0, 7);
  return record.date;
}


export function dossierToMember({ member, currentVersion: v }: DossierDetail): Member {
  const voice = v.voiceEvidence;
  const example = voice.example;
  const mayor = v.mayorAlignment;
  const hasExample = Boolean(
    example.quote || example.context || example.sourceName || example.sourceUrl,
  );
  const mayorHasParts = Boolean(mayor.relationship || mayor.sourceName || mayor.sourceUrl);

  return {
    id: member.slug || member.id,
    name: v.name,
    district: v.district,
    took_office: v.tookOffice,
    leadership_role: v.leadershipRole || 'None',
    bio: v.profile,
    voting_bloc: v.decisionPattern.votingBloc,
    committees: Object.fromEntries(v.committees.map((c) => [c.committee, c.role])),
    issue_positions: Object.fromEntries(
      v.issuePositions.map((p) => [
        p.topic,
        {
          stance: p.stance,
          evidence: p.evidence,
          source_name: p.sourceName,
          source_url: p.sourceUrl,
        },
      ]),
    ),
    key_votes: v.keyRecords.map((r) => ({
      id: r.lineageId,
      date: recordDateText(r),
      item: r.title,
      position: r.description || RECORD_OUTCOME_LABELS[r.outcome],
      source_name: r.sourceName,
      source_url: r.sourceUrl,
    })),
    notable_quotes: voice.quotes.map((q) => ({
      id: q.lineageId,
      quote: q.text,
      source_name: q.sourceName,
      source_url: q.sourceUrl,
      ...(q.context ? { context: q.context } : {}),
      ...(q.verbatim ? { verbatim: true } : {}),
    })),
    opposition_triggers: v.decisionPattern.oppositionTriggers.map((t) => t.text),
    persuasion_levers: v.decisionPattern.persuasionLevers.map((t) => t.text),
    data_gaps: v.dataGaps,
    mayor_alignment: mayorHasParts
      ? {
          relationship: mayor.relationship,
          example: mayor.example,
          source_name: mayor.sourceName,
          source_url: mayor.sourceUrl,
        }
      : mayor.example,
    political_style: v.politicalArchetype
      ? { archetype: v.politicalArchetype, description: v.politicalStyle }
      : v.politicalStyle,
    twin_voice: hasExample
      ? {
          style: voice.description,
          example_quote: example.quote,
          example_context: example.context,
          source_name: example.sourceName,
          source_url: example.sourceUrl,
        }
      : voice.description,
  };
}

function byDistrict(a: Member, b: Member): number {
  return (
    a.district.localeCompare(b.district, 'en', { numeric: true }) || a.name.localeCompare(b.name)
  );
}


async function workspaceInfo(workspaceId: string): Promise<WorkspaceInfo> {
  const settings = await getWorkspaceSettings(workspaceId);
  return { name: settings.name, voteRules: settings.voteRules };
}

export interface CouncilData {
  members: Member[];
  profile: CouncilProfile;
}

export async function loadCouncil(workspaceId: string): Promise<CouncilData> {
  const [summaries, info] = await Promise.all([listDossiers(), workspaceInfo(workspaceId)]);
  const details = await Promise.all(summaries.map((s) => getDossier(s.id)));
  const members = details.map(dossierToMember).sort(byDistrict);
  return { members, profile: councilProfile(members, info) };
}
