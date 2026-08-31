import { RequireAuth, SuspenseWrapper } from '@pawhaven/frontend-core';
import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { routerElementMapping } from './routerElementMapping';

import { useCurrentUser } from '@/features/Auth/api/auth.queries';
import { useLandingContext } from '@/features/Landing/landingContext';
import { routePaths } from '@/router/routePaths';
import type { RouterEle } from '@/types/LayoutType';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isLoading, isError } = useCurrentUser();

  return (
    <RequireAuth
      isLoading={isLoading}
      isError={isError}
      loginPath={routePaths.login}
    >
      {children}
    </RequireAuth>
  );
};

const createRouteElement = (route: RouterEle): ReactNode => {
  const handle = route.handle ?? {};
  const page = routerElementMapping[route.element];

  const element = handle?.isRequireUserLogin ? (
    <ProtectedRoute>{page}</ProtectedRoute>
  ) : (
    page
  );

  return <SuspenseWrapper>{element}</SuspenseWrapper>;
};

const generateRoutes = (routesConfig: RouterEle[]): RouteObject[] => {
  return routesConfig.map((route) => {
    const mappedRoute: RouteObject = {
      path: route.path ?? undefined,
      element: createRouteElement(route),
      handle: route.handle,
    };

    if (route.children?.length) {
      mappedRoute.children = generateRoutes(route.children);
    }

    return mappedRoute;
  });
};

export const AppRouterProvider = () => {
  const { routers } = useLandingContext();
  const routes = routers?.length ? generateRoutes(routers) : null;
  const router = routes ? createBrowserRouter(routes) : null;

  if (!router) return null;

  return <RouterProvider router={router} />;
};
