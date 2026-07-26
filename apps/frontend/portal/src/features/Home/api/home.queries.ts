import { useQuery } from '@tanstack/react-query';

import { getHeroStats, getLatestRescuesByNumber } from './home.api';
import { homeQueryKeys } from './home.queryKeys';

export const useFetchLatestRescuesByNumber = () => {
  return useQuery({
    queryKey: homeQueryKeys.latestRescues(),
    queryFn: getLatestRescuesByNumber,
  });
};

export const useFetchHeroStats = () => {
  return useQuery({
    queryKey: homeQueryKeys.heroStats(),
    queryFn: getHeroStats,
    staleTime: Infinity,
  });
};
