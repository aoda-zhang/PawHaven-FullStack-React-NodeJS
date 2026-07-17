import {
  NotFound,
  RouterErrorFallback,
  lazyImport,
} from '@pawhaven/frontend-core';
import type { ReactElement } from 'react';

import { Login } from '@/features/Auth/Login';
import { Register } from '@/features/Auth/Register';
import { Home } from '@/features/Home';
import { useIsStableEnv } from '@/hooks/useIsStableEnv';
import { RootLayout } from '@/layout';
import { RootLayoutFooter } from '@/layout/RootLayoutFooter';

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

const NotFoundRoute = () => {
  const isStableEnv = useIsStableEnv();
  return <NotFound isStableEnv={isStableEnv} footer={<RootLayoutFooter />} />;
};

const ErrorFallbackRoute = () => {
  const isStableEnv = useIsStableEnv();
  return (
    <RouterErrorFallback
      isStableEnv={isStableEnv}
      footer={<RootLayoutFooter />}
    />
  );
};

export const routerElementMapping: Record<string, ReactElement> = {
  rootLayout: <RootLayout />,
  home: <Home />,
  auth_login: <Login />,
  auth_register: <Register />,
  report_stray: <ReportStray />,
  rescue_guides: <RescueGuide />,
  rescue_detail: <ReportDetail />,
  notFund: <NotFoundRoute />,
  errorFallback: <ErrorFallbackRoute />,
};
