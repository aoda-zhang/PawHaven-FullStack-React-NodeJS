import { useQuery } from '@tanstack/react-query';

import { getAppBootstrap } from './requests';

type AppBootstrapScope = {
  userID: string;
  menuUpdateAt: string;
  routerUpdateAt: string;
};

export const landingQueryKeys = {
  all: ['landing'] as const,
  appBootstrap: (scope: AppBootstrapScope) =>
    [...landingQueryKeys.all, 'appBootstrap', scope] as const,
};

export const useGetAppBootstrap = (scope: AppBootstrapScope) => {
  const query = useQuery({
    queryKey: landingQueryKeys.appBootstrap(scope),
    queryFn: getAppBootstrap,
  });

  return query;
};
