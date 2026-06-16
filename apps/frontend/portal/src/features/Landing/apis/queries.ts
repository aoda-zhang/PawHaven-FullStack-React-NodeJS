import { useQuery } from '@tanstack/react-query';

import { getAppBootstrap } from './requests';

type AppBootstrapScope = {
  userID: string;
  menuUpdateAt: string;
  routerUpdateAt: string;
};

const queryKeys = {
  all: ['landing'] as const,
  appBootstrap: (scope: AppBootstrapScope) =>
    [...queryKeys.all, 'appBootstrap', scope] as const,
};

export const landingQueryKeys = queryKeys;

export const useGetAppBootstrap = (scope: AppBootstrapScope) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: landingQueryKeys.appBootstrap(scope),
    queryFn: getAppBootstrap,
  });

  return { data, isLoading, isError };
};
