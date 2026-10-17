import type {
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs,
} from 'react-router-dom';

import { bootstrapQueryOptions } from '@/app/api/bootstrap.queries';
import type { BootstrapScope } from '@/app/api/bootstrap.queryKeys';
import { getQueryClient } from '@/app/providers/QueryProvider';
import { routePaths } from '@/app/router/routePaths';
import { reducerNames } from '@/app/store/reducerNames';
import { store, type ReduxState } from '@/app/store/reduxStore';

const EMPTY_BOOTSTRAP = { menus: [], permissions: [] };

const isAuthPagePath = (pathname: string): boolean =>
  pathname === routePaths.login || pathname === routePaths.register;

export const rootLoader = async ({ request }: LoaderFunctionArgs) => {
  const profile = (store.getState() as ReduxState)?.[reducerNames.global]
    ?.profile;
  const userID = profile?.baseUserInfo?.userID ?? '';
  const { pathname } = new URL(request.url);

  if (isAuthPagePath(pathname)) {
    return EMPTY_BOOTSTRAP;
  }

  const queryClient = getQueryClient();
  const scope: BootstrapScope = {
    userID,
    menuUpdateAt: profile?.baseUserInfo?.globalMenuUpdateAt ?? '',
  };

  return queryClient.ensureQueryData(bootstrapQueryOptions(scope));
};

export const rootShouldRevalidate = ({
  currentUrl,
  nextUrl,
}: ShouldRevalidateFunctionArgs): boolean =>
  isAuthPagePath(currentUrl.pathname) !== isAuthPagePath(nextUrl.pathname);
