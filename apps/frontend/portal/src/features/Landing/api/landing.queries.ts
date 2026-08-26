import { useQuery } from '@tanstack/react-query';

import { getHomeData } from './landing.api';
import { landingQueryKeys, type HomeScope } from './landing.queryKeys';

export const useGetHomeData = (scope?: HomeScope) => {
  return useQuery({
    queryKey: landingQueryKeys.home(scope),
    queryFn: getHomeData,
    staleTime: Infinity,
  });
};
