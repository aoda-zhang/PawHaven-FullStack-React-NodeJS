import type { LoaderFunctionArgs } from 'react-router-dom';

import { rescueDetailQueryOptions } from './api/rescueDetail.queries';

import { getQueryClient } from '@/providers/QueryProvider';
import { routePaths } from '@/router/routePaths';

export const rescueCaseDetailLoader = async (animalID: string) => {
  const queryClient = getQueryClient();

  return {
    animal: queryClient.ensureQueryData(rescueDetailQueryOptions(animalID)),
  };
};

export const rescueDetailRoute = {
  path: routePaths.rescueCaseDetail,
  loader: ({ params }: LoaderFunctionArgs) =>
    rescueCaseDetailLoader(params.animalID ?? ''),
  lazy: async () => {
    const { RescueDetail } =
      await import('@/features/rescue-detail/RescueDetail');
    return { Component: RescueDetail };
  },
};
