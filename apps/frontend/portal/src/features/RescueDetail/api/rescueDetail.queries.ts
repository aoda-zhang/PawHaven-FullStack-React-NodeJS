import { useQuery } from '@tanstack/react-query';

import { getRescueDetail } from './rescueDetail.api';
import { rescueDetailQueryKeys } from './rescueDetail.queryKeys';

export const useFetchRescueDetail = (id: string) => {
  return useQuery({
    queryKey: rescueDetailQueryKeys.detail(id),
    queryFn: () => getRescueDetail(id),
    enabled: !!id,
  });
};
