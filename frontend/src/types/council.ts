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
  rulesOfProcedure: Citation | null;
  leadershipFallback: {
    chair: CouncilOfficer;
    viceChair: CouncilOfficer;
    chairEmeritus: CouncilOfficer;
  } | null;
  procedure: {
    oneShotStakes: { title: string; body: string } | null;
    committeeReferralHint: string;
    committeeChairHint: string;
    attendanceNote: string;
    consentNote: string;
  };
  research: {
    sourceCaveats: string[];
    knownLimitations: string;
  };
}
