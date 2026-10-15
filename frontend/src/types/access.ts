export const ROLES = ['CAO', 'STAFF'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['active', 'mfa-pending'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface Workspace {
  id: string;
  name: string;
}

export interface Membership {
  workspaceId: string;
  role: Role;
}

export interface AccessUser {
  id: string;
  name: string;
  email: string;
  mfaEnabled: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  memberships: Membership[];
}

export type UserInput = Pick<AccessUser, 'name' | 'email' | 'memberships'>;

export function userStatus(user: AccessUser): UserStatus {
  return user.mfaEnabled ? 'active' : 'mfa-pending';
}
