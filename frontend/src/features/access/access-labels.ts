import type { Role } from '@/types/access';

export const ROLE_LABELS: Record<Role, string> = { PRINCIPAL: 'Principal', AFFILIATE: 'Affiliate' };

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
