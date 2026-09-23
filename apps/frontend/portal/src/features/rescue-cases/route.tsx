import { rescueCasesQueryOptions } from './api/rescueCases.queries';

import { getQueryClient } from '@/providers/QueryProvider';
import { routePaths } from '@/router/routePaths';

export const rescueCasesLoader = async () => {
  const queryClient = getQueryClient();

  return queryClient.ensureQueryData(rescueCasesQueryOptions());
};

export const rescueCasesRoute = {
  path: routePaths.rescueCases,
  loader: rescueCasesLoader,
  lazy: async () => {
    const { RescueCasesPage } =
      await import('@/features/rescue-cases/RescueCases');
    return { Component: RescueCasesPage };
  },
};
