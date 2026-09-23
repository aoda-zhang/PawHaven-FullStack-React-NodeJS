import { Outlet, redirect } from 'react-router-dom';
import type { LoaderFunctionArgs } from 'react-router-dom';

import { getUserCurrent } from './api/auth.api';
import { authQueryKeys } from './api/auth.queryKeys';
import { Login } from './login/Login';
import { Register } from './register/Register';

import { getQueryClient } from '@/providers/QueryProvider';
import { routePaths, routeSearchParams } from '@/router/routePaths';
import { reducerNames } from '@/store/reducerNames';
import { store, type ReduxState } from '@/store/reduxStore';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const CURRENT_USER_STALE_MINUTES = 5;
const CURRENT_USER_STALE_TIME_MS =
  CURRENT_USER_STALE_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND;

const getCurrentUserId = (): string =>
  (store.getState() as ReduxState)?.[reducerNames.global]?.profile?.userID ??
  '';

export const currentUserQueryOptions = (userId: string) => ({
  queryKey: authQueryKeys.currentUser(userId),
  queryFn: getUserCurrent,
  staleTime: CURRENT_USER_STALE_TIME_MS,
  retry: false,
});

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
