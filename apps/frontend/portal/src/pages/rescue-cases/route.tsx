import { rescueCasesQueryOptions } from './api/rescueCases.queries';

import { getQueryClient } from '@/app/providers/QueryProvider';
import { routePaths } from '@/app/router/routePaths';

export const rescueCasesLoader = async () => {
  const queryClient = getQueryClient();

  return queryClient.ensureQueryData(rescueCasesQueryOptions());
};

export const rescueCasesRoute = {
  path: routePaths.rescueCases,
  loader: rescueCasesLoader,
  lazy: async () => {
    const { RescueCasesPage } = await import('@/pages/rescue-cases');
    return { Component: RescueCasesPage };
  },
};
