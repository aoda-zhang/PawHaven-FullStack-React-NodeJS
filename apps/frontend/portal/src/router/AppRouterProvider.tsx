import { SuspenseWrapper } from '@pawhaven/ui';
import { type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { routerElementMapping } from './routerElementMapping';

import { useLandingContext } from '@/features/Landing/landingContext';
import type { RouterEle } from '@/types/LayoutType';

// Route rendering is now purely declarative.
// Login gating is handled by backend 401 responses + global auth error redirect.
const createRouteElement = (route: RouterEle): ReactNode => {
  const handle = route.handle ?? {};
  return handle.isLazyLoad ? (
    <SuspenseWrapper>{routerElementMapping[route.element]}</SuspenseWrapper>
  ) : (
    routerElementMapping[route.element]
  );
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
