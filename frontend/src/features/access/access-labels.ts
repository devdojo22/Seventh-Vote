import type { Role, UserStatus } from '@/types/access';

export const ROLE_LABELS: Record<Role, string> = { CAO: 'CAO', STAFF: 'Staff' };

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  CAO: 'Full use of this workspace: sessions, dossiers and prep briefs.',
  STAFF: 'Rights not defined yet; awaiting client confirmation for M2.',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  'mfa-pending': 'MFA setup pending',
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
