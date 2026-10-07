import type { Citation } from './simulation';

export interface CouncilOfficer {
  title: string;
  name: string;
}

export interface CouncilConfig {
  councilName: string;
  seatCount: number;
  termLabel: string;
  snapshotLabel: string;
  snapshotNote: string;
  rulesOfProcedure: Citation;
  /** Used when a dossier's free-text leadership_role cannot be parsed unambiguously. */
  leadershipFallback: {
    chair: CouncilOfficer;
    viceChair: CouncilOfficer;
    chairEmeritus: CouncilOfficer;
  };
  /** Procedural copy shown beside results. */
  procedure: {
    oneShotStakes: { title: string; body: string };
    committeeReferralHint: string;
    committeeChairHint: string;
    attendanceNote: string;
    consentNote: string;
  };
}
