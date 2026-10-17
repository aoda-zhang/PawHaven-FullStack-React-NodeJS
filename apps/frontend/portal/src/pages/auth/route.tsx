import { Outlet, redirect } from 'react-router-dom';
import type { LoaderFunctionArgs } from 'react-router-dom';

import { Login } from './login';
import { Register } from './register';

import {
  currentUserQueryOptions,
  getCurrentUserId,
} from '@/app/api/currentUser';
import { getQueryClient } from '@/app/providers/QueryProvider';
import { routePaths, routeSearchParams } from '@/app/router/routePaths';

export const requireUser = async ({ request }: LoaderFunctionArgs) => {
  const { pathname, search } = new URL(request.url);
  const redirectTo = `${routePaths.login}?${routeSearchParams.redirect}=${encodeURIComponent(`${pathname}${search}`)}`;

  try {
    await getQueryClient().ensureQueryData(
      currentUserQueryOptions(getCurrentUserId()),
    );
  } catch {
    throw redirect(redirectTo);
  }

  return null;
};

export const AuthenticatedLayout = () => <Outlet />;

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
