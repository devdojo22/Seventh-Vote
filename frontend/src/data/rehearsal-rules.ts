import type { RehearsalRules } from '@/types/simulation';

/**
 * Snapshot-specific rehearsal rules for Ordinance 5982 and the bloc watch.
 * Reason templates use {name} for the member's name. Replace with dossier-driven
 * data once a backend exists.
 */
export const rehearsalRules: RehearsalRules = {
  moratorium: {
    leadSponsorId: 'jb-smiley-jr',
    sponsorIds: [
      'jb-smiley-jr',
      'jana-swearengen-washington',
      'jerri-green',
      'michalyn-easter-thomas',
    ],
    sponsorReasons: {
      lead: {
        support:
          'Smiley’s Sept. 14 public statement upgrades this read to strongly committed support. Combined with his lead sponsorship, reversal after that public commitment would carry substantial political cost. Rule 23 still permits a sponsor to vote no, so this is strong evidence—not certainty.',
        oppose:
          'Smiley’s Sept. 14 public statement and lead sponsorship indicate strongly committed support, so the record weighs sharply against an ask to oppose. Rule 23 still permits a sponsor to vote no, but reversal after a public statement the night before the vote would carry substantial political cost.',
      },
      cosponsor: {
        support:
          '{name} is named as a co-sponsor in the Aug. 31 published draft, a strong support signal. Rule 23 still permits a sponsor to vote no, so this remains a rehearsal hypothesis rather than certainty.',
        oppose:
          '{name} is named as a co-sponsor in the Aug. 31 published draft, a strong support signal that weighs against an ask to oppose. Rule 23 still permits a sponsor to vote no, so this remains a rehearsal hypothesis rather than certainty.',
      },
    },
  },
  loganMoratorium: {
    memberId: 'rhonda-logan',
    voteDate: '2026-09-15',
    positionPattern: /leaning support signal/i,
    reasons: {
      support:
        'Logan’s Sept. 15 committee statement is a leaning-support signal: she said she was “not opposed to a moratorium or data centers” and wanted better zoning for regulation and siting. Data gap: this rests on one committee statement, not a recorded floor vote, so confidence remains modest.',
      oppose:
        'Logan’s Sept. 15 committee statement is a soft pro-moratorium signal, so it weighs against an ask to oppose. She said she was “not opposed to a moratorium or data centers” and wanted better zoning for regulation and siting. Data gap: this rests on one committee statement, not a recorded floor vote.',
    },
  },
  noDirectVoiceMemberIds: ['edmund-ford-sr'],
  thinRecordMemberIds: ['janika-white', 'edmund-ford-sr'],
  blocWatch: {
    memberId: 'michalyn-easter-thomas',
    votingBlocPattern: /Smiley|Green|Swearengen|Warren|Cooper-Sutton/,
  },
};
