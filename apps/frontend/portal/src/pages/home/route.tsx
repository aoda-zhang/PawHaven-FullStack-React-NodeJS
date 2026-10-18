import { homeQueryOptions } from './api/home.queries';

import { getQueryClient } from '@/app/providers/QueryProvider';
import { Home } from '@/pages/home';

export const homeLoader = async () => {
  const queryClient = getQueryClient();

  return queryClient.ensureQueryData(homeQueryOptions());
};

export const homeRoute = {
  index: true,
  loader: homeLoader,
  Component: Home,
};
