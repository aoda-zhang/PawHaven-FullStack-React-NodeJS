import { Loading } from '@pawhaven/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';

import { currentUserQueryOptions } from '@/app/init/currentUser';
import { useGlobalContext } from '@/app/providers/GlobalProvider';
import { routePaths, routeSearchParams } from '@/app/router/routePaths';

const toLogin = (pathname: string, search: string) =>
  `${routePaths.login}?${routeSearchParams.redirect}=${encodeURIComponent(pathname + search)}`;

interface AuthCheckProps {
  userId: string;
  pathname: string;
  search: string;
}

const AuthCheck = ({ userId, pathname, search }: AuthCheckProps) => {
  const { data: user } = useSuspenseQuery(currentUserQueryOptions(userId));

  if (!user) {
    return <Navigate to={toLogin(pathname, search)} replace />;
  }

  return <Outlet />;
};

export const AuthenticatedLayout = () => {
  const { pathname, search } = useLocation();
  const { userInfo } = useGlobalContext();

  return (
    <Suspense fallback={<Loading />}>
      <AuthCheck
        userId={userInfo?.userId ?? ''}
        pathname={pathname}
        search={search}
      />
    </Suspense>
  );
};

export const loginRoute = {
  path: routePaths.login,
  lazy: async () => {
    const { Login } = await import('./login');
    return { Component: Login };
  },
  handle: { isMenuAvailable: false, isFooterAvailable: false },
};

export const registerRoute = {
  path: routePaths.register,
  lazy: async () => {
    const { Register } = await import('./register');
    return { Component: Register };
  },
  handle: { isMenuAvailable: false, isFooterAvailable: false },
};
