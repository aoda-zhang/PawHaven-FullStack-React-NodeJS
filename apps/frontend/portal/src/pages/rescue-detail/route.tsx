import type { LoaderFunctionArgs } from 'react-router-dom';

import { rescueDetailQueryOptions } from './api/rescueDetail.queries';

import { getQueryClient } from '@/app/providers/QueryProvider';
import { routePaths } from '@/app/router/routePaths';

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
    const { RescueDetail } = await import('@/pages/rescue-detail');
    return { Component: RescueDetail };
  },
};
