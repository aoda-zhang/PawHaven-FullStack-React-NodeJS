import { queryOptions } from '@tanstack/react-query';

import { getHomeData } from './home.api';
import { homeQueryKeys } from './home.queryKeys';

export const homeQueryOptions = () =>
  queryOptions({
    queryKey: homeQueryKeys.content(),
    queryFn: getHomeData,
  });
