import { queryOptions } from '@tanstack/react-query';

import { getRescueDetail } from './rescueDetail.api';
import { rescueDetailQueryKeys } from './rescueDetail.queryKeys';

export const rescueDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: rescueDetailQueryKeys.detail(id),
    queryFn: () => getRescueDetail(id),
    enabled: !!id,
  });
