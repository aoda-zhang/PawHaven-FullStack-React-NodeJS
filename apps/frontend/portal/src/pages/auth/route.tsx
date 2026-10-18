import { Loading } from '@pawhaven/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, use } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';

import { Login } from './login';
import { Register } from './register';

import {
  currentUserQueryOptions,
  getCurrentUserId,
} from '@/app/init/currentUser';
import { routePaths, routeSearchParams } from '@/app/router/routePaths';

const AuthCheck = () => {
  const location = useLocation();
  const userId = getCurrentUserId();

  const { data: user } = useSuspenseQuery(currentUserQueryOptions(userId));

  if (!user) {
    const redirectTo = `${routePaths.login}?${routeSearchParams.redirect}=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export const AuthenticatedLayout = () => (
  <Suspense fallback={<Loading />}>
    <AuthCheck />
  </Suspense>
);

export const loginRoute = {
  path: routePaths.login,
  Component: Login,
  handle: { isMenuAvailable: false, isFooterAvailable: false },
};

export const registerRoute = {
  path: routePaths.register,
  Component: Register,
  handle: { isMenuAvailable: false, isFooterAvailable: false },
};
