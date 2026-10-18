import { queryOptions } from '@tanstack/react-query';

import { fetchRescueCases } from './rescueCases.api';
import { rescueCasesQueryKeys } from './rescueCases.queryKeys';

export const rescueCasesQueryOptions = () =>
  queryOptions({
    queryKey: rescueCasesQueryKeys.all,
    queryFn: () => fetchRescueCases(),
  });
