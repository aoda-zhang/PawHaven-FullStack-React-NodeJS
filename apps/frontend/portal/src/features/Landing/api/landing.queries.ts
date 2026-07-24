import { useQuery } from '@tanstack/react-query';

import { getAppBootstrap } from './landing.api';
import { landingQueryKeys, type BootstrapScope } from './landing.queryKeys';

export const useGetAppBootstrap = (scope?: BootstrapScope) => {
  return useQuery({
    queryKey: landingQueryKeys.bootstrap(scope),
    queryFn: getAppBootstrap,
    staleTime: Infinity,
  });
};
