import type { AccessUser, Workspace } from '@/types/access';

export const SAMPLE_WORKSPACES: Workspace[] = [
  { id: 'ws-memphis', name: 'Memphis City Council' },
  { id: 'ws-sandbox', name: 'Pilot sandbox' },
];

export const SAMPLE_USERS: AccessUser[] = [
  {
    id: 'u-1',
    name: 'Avery Collins',
    email: 'avery.collins@example.gov',
    mfaEnabled: true,
    isSuperAdmin: false,
    createdAt: '2026-08-04',
    memberships: [
      { workspaceId: 'ws-memphis', role: 'CAO' },
      { workspaceId: 'ws-sandbox', role: 'CAO' },
    ],
  },
  {
    id: 'u-2',
    name: 'Morgan Reyes',
    email: 'morgan.reyes@example.gov',
    mfaEnabled: true,
    isSuperAdmin: true,
    createdAt: '2026-07-28',
    memberships: [{ workspaceId: 'ws-sandbox', role: 'CAO' }],
  },
  {
    id: 'u-3',
    name: 'Dana Whitfield',
    email: 'dana.whitfield@example.gov',
    mfaEnabled: true,
    isSuperAdmin: false,
    createdAt: '2026-08-04',
    memberships: [{ workspaceId: 'ws-memphis', role: 'CAO' }],
  },
  {
    id: 'u-4',
    name: 'Jordan Ellis',
    email: 'jordan.ellis@example.gov',
    mfaEnabled: true,
    isSuperAdmin: false,
    createdAt: '2026-08-12',
    memberships: [{ workspaceId: 'ws-memphis', role: 'STAFF' }],
  },
  {
    id: 'u-5',
    name: 'Priya Raman',
    email: 'priya.raman@example.gov',
    mfaEnabled: true,
    isSuperAdmin: false,
    createdAt: '2026-08-19',
    memberships: [
      { workspaceId: 'ws-memphis', role: 'STAFF' },
      { workspaceId: 'ws-sandbox', role: 'STAFF' },
    ],
  },
  {
    id: 'u-6',
    name: 'Marcus Bell',
    email: 'marcus.bell@example.gov',
    mfaEnabled: false,
    isSuperAdmin: false,
    createdAt: '2026-09-02',
    memberships: [{ workspaceId: 'ws-memphis', role: 'STAFF' }],
  },
  {
    id: 'u-7',
    name: 'Lena Park',
    email: 'lena.park@example.gov',
    mfaEnabled: true,
    isSuperAdmin: false,
    createdAt: '2026-09-08',
    memberships: [{ workspaceId: 'ws-memphis', role: 'STAFF' }],
  },
  {
    id: 'u-8',
    name: 'Sam Okafor',
    email: 'sam.okafor@example.gov',
    mfaEnabled: false,
    isSuperAdmin: false,
    createdAt: '2026-09-21',
    memberships: [{ workspaceId: 'ws-sandbox', role: 'STAFF' }],
  },
];
