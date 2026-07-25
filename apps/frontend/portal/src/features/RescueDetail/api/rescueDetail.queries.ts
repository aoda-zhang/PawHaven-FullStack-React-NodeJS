import { useQuery } from '@tanstack/react-query';

import { getRescueDetail } from './rescueDetail.api';
import { rescueDetailQueryKeys } from './rescueDetail.queryKeys';

export const useFetchRescueDetail = (animalId: string) => {
  return useQuery({
    queryKey: rescueDetailQueryKeys.detail(animalId),
    queryFn: () => getRescueDetail(animalId),
    enabled: !!animalId,
  });
};
