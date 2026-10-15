import { Navigate, type RouteObject } from 'react-router';
import { AccessPage } from '@/features/access/AccessPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { MfaPage } from '@/features/auth/MfaPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ChamberPage } from '@/features/chamber/ChamberPage';
import { MethodologyPage } from '@/features/methodology/MethodologyPage';
import { PrepPage } from '@/features/prep/PrepPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { SessionPage } from '@/features/session/SessionPage';
import { AppLayout } from './layout/AppLayout';
import { AuthLayout } from './layout/AuthLayout';

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'verify', element: <MfaPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <ChamberPage /> },
      { path: 'session', element: <SessionPage /> },
      { path: 'prep', element: <PrepPage /> },
      { path: 'method', element: <MethodologyPage /> },
      { path: 'access', element: <AccessPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
