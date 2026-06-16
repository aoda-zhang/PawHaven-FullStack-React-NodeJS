import { useQuery } from '@tanstack/react-query';

import { getLatestRescuesByNumber } from './requests';

const queryKeys = {
  all: ['home'] as const,
  latestRescues: () => [...queryKeys.all, 'latestRescues'] as const,
};

export const homeQueryKeys = queryKeys;

export const useFetchLatestRescuesByNumber = () => {
  return useQuery({
    queryKey: queryKeys.latestRescues(),
    queryFn: getLatestRescuesByNumber,
  });
};
