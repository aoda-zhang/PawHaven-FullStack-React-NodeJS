import { SuspenseWrapper } from '@pawhaven/ui';
import { type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { routerElementMapping } from './routerElementMapping';

import { useLandingContext } from '@/features/Landing/landingContext';
import { AuthGuard } from '@/router/AuthGuard';
import type { RouterEle } from '@/types/LayoutType';

// Applies route-level guards such as AuthGuard to a route element
const wrapWithGuards = (node: ReactNode, handle?: RouterEle['handle']) => {
  const routeWrappers = [
    (childNode: ReactNode) =>
      handle?.isRequireUserLogin ? (
        <AuthGuard>{childNode}</AuthGuard>
      ) : (
        childNode
      ),
  ];

  return routeWrappers.reduceRight((childNode, wrap) => wrap(childNode), node);
};

const createRouteElement = (route: RouterEle): ReactNode => {
  const handle = route.handle ?? {};
  const componentElement = handle.isLazyLoad ? (
    <SuspenseWrapper>{routerElementMapping[route.element]}</SuspenseWrapper>
  ) : (
    routerElementMapping[route.element]
  );

  return wrapWithGuards(componentElement, handle);
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
