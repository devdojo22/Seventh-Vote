import type { PreviousPrincipalOutcome, Role } from '@/types/access';

export const ROLE_LABELS: Record<Role, string> = { PRINCIPAL: 'Principal', AFFILIATE: 'Affiliate' };

export const PREVIOUS_PRINCIPAL_OUTCOME_LABELS: Record<PreviousPrincipalOutcome, string> = {
  REMOVE: 'Remove from workspace',
  KEEP_AS_AFFILIATE: 'Keep as Affiliate',
};

export const PREVIOUS_PRINCIPAL_OUTCOME_DESCRIPTIONS: Record<PreviousPrincipalOutcome, string> = {
  REMOVE:
    'The current Principal loses access to this workspace and is signed out of it. Their account and other workspaces are not affected.',
  KEEP_AS_AFFILIATE:
    'The current Principal stays in this workspace as an Affiliate without dossier-edit permission, and is signed out of it once.',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  PRINCIPAL:
    'Owns this workspace: invites and removes Affiliates, sets their permissions, and controls workspace settings.',
  AFFILIATE:
    'Views dossiers, runs rehearsals and views results. Editing dossiers needs the Principal’s permission.',
};

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(`${isoDate}T00:00:00Z`));
}
