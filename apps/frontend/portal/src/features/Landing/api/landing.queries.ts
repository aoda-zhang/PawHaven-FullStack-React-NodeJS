import { useQuery } from '@tanstack/react-query';

import { getAppBootstrap } from './landing.api';
import { landingQueryKeys } from './landing.queryKeys';

export const useGetAppBootstrap = () => {
  return useQuery({
    queryKey: landingQueryKeys.bootstrap(),
    queryFn: getAppBootstrap,
    staleTime: Infinity,
  });
};
