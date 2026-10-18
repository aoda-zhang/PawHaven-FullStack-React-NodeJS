import { NotFound, RouterErrorFallback } from '@pawhaven/frontend-core';
import { Loading } from '@pawhaven/ui';
import { createBrowserRouter, ScrollRestoration } from 'react-router-dom';

import { requireUser } from '@/app/init/guards';
import { rootLoader, rootShouldRevalidate } from '@/app/init/loader';
import { RootLayout } from '@/app/layout/RootLayout';
import { RootLayoutFooter } from '@/app/layout/RootLayoutFooter';
import { routePaths } from '@/app/router/routePaths';
import {
  AuthenticatedLayout,
  loginRoute,
  registerRoute,
} from '@/pages/auth/route';
import { homeRoute } from '@/pages/home/route';
import { reportAnimalRoute } from '@/pages/report-animal/route';
import { rescueCasesRoute } from '@/pages/rescue-cases/route';
import { rescueDetailRoute } from '@/pages/rescue-detail/route';
import { rescueGuideRoute } from '@/pages/rescue-guide/route';
import { useIsStableEnv } from '@/shared/hooks/useIsStableEnv';

const RouteErrorBoundary = () => {
  const isStableEnv = useIsStableEnv();

  return (
    <>
      <ScrollRestoration />
      <RouterErrorFallback
        isStableEnv={isStableEnv}
        footer={<RootLayoutFooter />}
      />
    </>
  );
};

const RouteHydrateFallback = () => <Loading />;

export const rootRoute = {
  path: routePaths.home,
  Component: RootLayout,
  loader: rootLoader,
  shouldRevalidate: rootShouldRevalidate,
  ErrorBoundary: RouteErrorBoundary,
  HydrateFallback: RouteHydrateFallback,
  children: [
    homeRoute,
    loginRoute,
    registerRoute,
    rescueGuideRoute,
    rescueCasesRoute,
    rescueDetailRoute,
    {
      id: 'authenticated',
      loader: requireUser,
      Component: AuthenticatedLayout,
      children: [reportAnimalRoute],
    },
    {
      path: '*',
      Component: NotFound,
    },
  ],
};

export const router = createBrowserRouter([rootRoute]);
