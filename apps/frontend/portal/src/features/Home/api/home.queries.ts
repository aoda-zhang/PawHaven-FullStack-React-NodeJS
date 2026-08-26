import { useQuery } from '@tanstack/react-query';

import { fetchRescueCases } from '../../RescueCases/api/rescueCases.api';

import { getAdoptablePets } from './home.api';
import { homeQueryKeys } from './home.queryKeys';

export const useFetchLatestRescues = (limit: number) => {
  return useQuery({
    queryKey: homeQueryKeys.latestRescues(limit),
    queryFn: () => fetchRescueCases(limit),
  });
};

export const useFetchAdoptablePets = () => {
  return useQuery({
    queryKey: homeQueryKeys.adoptablePets(),
    queryFn: getAdoptablePets,
  });
};
