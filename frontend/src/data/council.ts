import type { CouncilConfig } from '@/types/council';

export const councilConfig: CouncilConfig = {
  councilName: 'Memphis City Council',
  seatCount: 13,
  termLabel: '2024–27',
  snapshotLabel: 'Research snapshot · Sep 16, 2026',
  snapshotNote: 'Runs locally against the Sep 16 public-record snapshot.',
  rulesOfProcedure: {
    id: 'rules-of-procedure',
    name: 'Memphis City Council Rules of Procedure',
    url: 'https://memphistn.gov/wp-content/uploads/2025/09/Council-Rules-of-Procedure-092025.pdf',
    label: 'Council Rules of Procedure (through Sep. 9, 2025)',
  },
  leadershipFallback: {
    chair: { title: 'Chairwoman', name: 'Jana Swearengen-Washington' },
    viceChair: { title: 'Vice Chairman', name: 'Chase Carlisle' },
    chairEmeritus: { title: 'Chair Emeritus', name: 'JB Smiley, Jr.' },
  },
  procedure: {
    oneShotStakes: {
      title: 'One-shot stakes · Rule 39b',
      body: 'Once an item is finally approved or rejected, it cannot return to the agenda for six months (at least 12 official weekly meetings).',
    },
    committeeReferralHint: 'Rules 38a and 39c require committee referral for non-routine items.',
    committeeChairHint: 'The committee chair’s name appears with the item after committee action.',
    attendanceNote:
      'Absent and recused members are excluded from “majority present” math. Full-membership thresholds stay fixed. Recusal denominator treatment is a rehearsal assumption pending Charter or legal verification.',
    consentNote:
      'Rule 45 allows any one member to pull an item from consent for normal handling. Focus on objection risk, not a passage count.',
  },
};
