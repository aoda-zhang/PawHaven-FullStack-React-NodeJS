import { useQuery } from '@tanstack/react-query';

import { getLatestRescuesByNumber, getLatestStories } from './requests';

export const homeQueryKeys = {
  all: ['home'] as const,
  latestRescues: () => [...homeQueryKeys.all, 'latestRescues'] as const,
  latestStories: () => [...homeQueryKeys.all, 'latestStories'] as const,
};

export const useFetchLatestRescuesByNumber = () => {
  return useQuery({
    queryKey: homeQueryKeys.latestRescues(),
    queryFn: getLatestRescuesByNumber,
  });
};

export const useFetchLatestStories = () => {
  return useQuery({
    queryKey: homeQueryKeys.latestStories(),
    queryFn: getLatestStories,
  });
};
