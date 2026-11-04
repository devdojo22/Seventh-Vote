import type { ActionRule } from '@/types/simulation';

/** The Memphis snapshot's ordinary rule, while its workspace has no saved vote rules. */
export const ORDINARY_INFERENCE_NOTE =
  'Working inference only · ordinary passage is Charter-governed and not verified in the Rules';

export const PROCEDURAL_RULES: ActionRule[] = [
  {
    id: 'censure',
    label: 'Censure of a member',
    basis: 'full',
    needed: 9,
    verified: true,
    note: 'Rule 49 · confirmed',
  },
  {
    id: 'rules_amendment',
    label: 'Amend Rules of Procedure',
    basis: 'full',
    needed: 7,
    verified: true,
    note: 'Rule 53 · confirmed; seven days’ written notice also required',
  },
  {
    id: 'appeal_chair',
    label: 'Appeal Chair ruling',
    basis: 'present',
    verified: true,
    note: 'Rule 27 · majority of members present',
  },
  {
    id: 'defer_drop',
    label: 'Defer or drop item',
    basis: 'present',
    verified: true,
    note: 'Rule 41 · majority of members present',
  },
  {
    id: 'order_business',
    label: 'Change order of business',
    basis: 'present',
    verified: true,
    note: 'Rule 29 · majority present, or Chair discretion',
  },
  {
    id: 'consent',
    label: 'Consent-routed item',
    basis: 'consent',
    verified: true,
    note: 'Rule 45 · one objection removes the item from consent',
  },
];
