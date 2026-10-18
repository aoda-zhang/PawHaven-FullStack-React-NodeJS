import { redirect } from 'react-router-dom';
import type { LoaderFunctionArgs } from 'react-router-dom';

import {
  currentUserQueryOptions,
  getCurrentUserId,
} from '@/app/init/currentUser';
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
