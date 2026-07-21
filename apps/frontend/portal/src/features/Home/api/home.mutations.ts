import { useQuery } from '@tanstack/react-query';

import { getLatestRescuesByNumber } from './home.api';
import { homeQueryKeys } from './home.queryKeys';

export const useFetchLatestRescuesByNumber = () => {
  return useQuery({
    queryKey: homeQueryKeys.latestRescues(),
    queryFn: getLatestRescuesByNumber,
  });
};
