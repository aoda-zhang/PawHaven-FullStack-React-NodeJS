import { lazyImport } from '@pawhaven/frontend-core';
import type { ReactElement } from 'react';

import { NotFound } from '@/components/NotFound';
import { RouterErrorFallback } from '@/components/RouterErrorFallback';
import { Login } from '@/features/Auth/Login';
import { Register } from '@/features/Auth/Register';
import { Home } from '@/features/Home';
import { RootLayout } from '@/layout';

const ReportStray = lazyImport(
  () => import('@/features/ReportStray'),
  'ReportStray',
);
const ReportDetail = lazyImport(
  () => import('@/features/RescueDetail'),
  'RescueDetail',
);
const RescueGuide = lazyImport(
  () => import('@/features/RescueGuide'),
  'RescueGuide',
);

export const routerElementMapping: Record<string, ReactElement> = {
  rootLayout: <RootLayout />,
  home: <Home />,
  auth_login: <Login />,
  auth_register: <Register />,
  report_stray: <ReportStray />,
  rescue_guides: <RescueGuide />,
  rescue_detail: <ReportDetail />,
  notFund: <NotFound />,
  errorFallback: <RouterErrorFallback />,
};
