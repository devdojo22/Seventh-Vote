import type { SessionInput } from '@/types/simulation';

export const SESSION_DEFAULTS: Omit<SessionInput, 'districts' | 'attendance'> = {
  title: 'Ordinance 5982 — 12-month data-center moratorium',
  desc: 'Published draft sponsors: JB Smiley Jr., Jana Swearengen-Washington, Jerri Green, and Dr. Michalyn Easter-Thomas. A temporary moratorium on the acceptance, processing, approval, and issuance of zoning, land-use, building, and associated infrastructure permits for “Data Center” and “High-Density Computing Facility” developments. Applications may be accepted only for docketing and completeness review; substantive review deadlines are tolled. Duration is the earliest of 12 months after the effective date, adoption of comprehensive zoning regulations, or repeal or amendment; the Council may extend it after a six-month progress report. Exemptions cover existing lawfully operating data centers that are not expanding, legally vested applications, routine maintenance, and accessory computing uses subordinate to another lawful principal use, including hospitals and financial, educational, and governmental uses; a Council waiver process is available. A study committee made up of the Council Chair and Vice Chair, MLGW, and industry experts will prepare permanent zoning recommendations across 18 topics, including noise, water, infrastructure-cost allocation, and community-benefits agreements. Authority: Tennessee Code Annotated § 13-7-201. Working reference: Ordinance 5982; the published pre-final draft’s ordinance-number field was blank.',
  category: 'economic_development_pilots',
  ask: 'Ordinance change',
  actionType: 'ordinary',
  fiscal: 'neutral',
  impact: 'citywide',
  priority: 'no',
  committee: '',
  committeeChair: '',
};
