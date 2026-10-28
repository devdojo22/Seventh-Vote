import { Navigate, type RouteObject } from 'react-router';
import { AdminWorkspacesPage } from '@/features/access/AdminWorkspacesPage';
import { MembersPage } from '@/features/access/MembersPage';
import { RequireWorkspace } from '@/features/access/RequireWorkspace';
import { WorkspaceSettingsPage } from '@/features/access/WorkspaceSettingsPage';
import { AcceptInvitationPage } from '@/features/auth/AcceptInvitationPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { MfaPage } from '@/features/auth/MfaPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { ChamberPage } from '@/features/chamber/ChamberPage';
import { MethodologyPage } from '@/features/methodology/MethodologyPage';
import { PrepPage } from '@/features/prep/PrepPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { SessionPage } from '@/features/session/SessionPage';
import type { RouteHandle } from '@/lib/route-title';
import { AppLayout } from './layout/AppLayout';
import { AuthLayout } from './layout/AuthLayout';
import { RootLayout } from './layout/RootLayout';

const page = (title: string): RouteHandle => ({ title });

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage />, handle: page('Sign in') },
          { path: 'invite', element: <AcceptInvitationPage />, handle: page('Invitation') },
          { path: 'verify', element: <MfaPage />, handle: page('Verification') },
          {
            path: 'forgot-password',
            element: <ForgotPasswordPage />,
            handle: page('Forgot password'),
          },
          {
            path: 'reset-password',
            element: <ResetPasswordPage />,
            handle: page('Reset password'),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                element: <RequireWorkspace />,
                children: [
                  { index: true, element: <ChamberPage />, handle: page('Home') },
                  { path: 'session', element: <SessionPage />, handle: page('Council Session') },
                  { path: 'prep', element: <PrepPage />, handle: page('1-on-1 Prep') },
                  { path: 'method', element: <MethodologyPage />, handle: page('Methodology') },
                  {
                    path: 'workspaces/:workspaceId/members',
                    element: <MembersPage />,
                    handle: page('Members'),
                  },
                  {
                    path: 'workspaces/:workspaceId/settings',
                    element: <WorkspaceSettingsPage />,
                    handle: page('Vote rules'),
                  },
                ],
              },
              { path: 'profile', element: <ProfilePage />, handle: page('Profile') },
              {
                path: 'admin/workspaces',
                element: <AdminWorkspacesPage />,
                handle: page('Workspaces'),
              },
              { path: '*', element: <Navigate to="/" replace /> },
            ],
          },
        ],
      },
    ],
  },
];
