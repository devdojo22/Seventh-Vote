import { Navigate, type RouteObject } from 'react-router';
import { ChamberPage } from '@/features/chamber/ChamberPage';
import { MethodPage } from '@/features/methodology/MethodPage';
import { PrepPage } from '@/features/prep/PrepPage';
import { SessionPage } from '@/features/session/SessionPage';
import { AppLayout } from './layout/AppLayout';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <ChamberPage /> },
      { path: 'session', element: <SessionPage /> },
      { path: 'prep', element: <PrepPage /> },
      { path: 'method', element: <MethodPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
