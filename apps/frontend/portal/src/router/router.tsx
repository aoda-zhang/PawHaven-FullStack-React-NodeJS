import { NotFound, RouterErrorFallback } from '@pawhaven/frontend-core';
import { Loading } from '@pawhaven/ui';
import { createBrowserRouter, ScrollRestoration } from 'react-router-dom';

import {
  AuthenticatedLayout,
  loginRoute,
  registerRoute,
  requireUser,
} from '@/features/auth/route';
import { homeRoute } from '@/features/home/route';
import { reportAnimalRoute } from '@/features/report-animal/route';
import { rescueCasesRoute } from '@/features/rescue-cases/route';
import { rescueDetailRoute } from '@/features/rescue-detail/route';
import { rescueGuideRoute } from '@/features/rescue-guide/route';
import { useIsStableEnv } from '@/hooks/useIsStableEnv';
import {
  rootLoader,
  rootShouldRevalidate,
} from '@/layout/api/rootLayout.loader';
import { RootLayout } from '@/layout/RootLayout';
import { RootLayoutFooter } from '@/layout/RootLayoutFooter';
import { routePaths } from '@/router/routePaths';

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
