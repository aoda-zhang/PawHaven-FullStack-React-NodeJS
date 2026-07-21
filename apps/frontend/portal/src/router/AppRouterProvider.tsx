import { RequireAuth } from '@pawhaven/frontend-core';
import { SuspenseWrapper } from '@pawhaven/ui';
import { type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { routerElementMapping } from './routerElementMapping';

import { useCurrentUser } from '@/features/Auth/apis/queries';
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
  if (!routers || routers?.length === 0) return null;

  const routes: RouteObject[] = generateRoutes(routers);

  return <RouterProvider router={createBrowserRouter(routes)} />;
};
