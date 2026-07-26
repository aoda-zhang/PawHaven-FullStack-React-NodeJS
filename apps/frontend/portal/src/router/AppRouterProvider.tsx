import { RequireAuth } from '@pawhaven/frontend-core';
import { SuspenseWrapper } from '@pawhaven/ui';
import { useMemo, type ReactNode } from 'react';
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
  const page = handle.isLazyLoad ? (
    <SuspenseWrapper>{routerElementMapping[route.element]}</SuspenseWrapper>
  ) : (
    routerElementMapping[route.element]
  );

  if (handle?.isRequireUserLogin) {
    return <ProtectedRoute>{page}</ProtectedRoute>;
  }

  return page;
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
  const routes = useMemo<RouteObject[] | null>(() => {
    if (!routers || routers.length === 0) return null;
    return generateRoutes(routers);
  }, [routers]);

  const router = useMemo(() => {
    if (!routes) return null;
    return createBrowserRouter(routes);
  }, [routes]);

  if (!router) return null;

  return <RouterProvider router={router} />;
};
