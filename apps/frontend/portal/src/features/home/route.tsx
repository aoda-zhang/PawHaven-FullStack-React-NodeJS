import { homeQueryOptions } from './api/home.queries';

import { Home } from '@/features/home/Home';
import { getQueryClient } from '@/providers/QueryProvider';

export const homeLoader = async () => {
  const queryClient = getQueryClient();

  return queryClient.ensureQueryData(homeQueryOptions());
};

export const homeRoute = {
  index: true,
  loader: homeLoader,
  Component: Home,
};
