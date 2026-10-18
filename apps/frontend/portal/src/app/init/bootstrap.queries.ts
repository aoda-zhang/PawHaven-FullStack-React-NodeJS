import { queryOptions } from '@tanstack/react-query';

import { getBootstrapData } from './bootstrap.api';
import { bootstrapQueryKeys, type BootstrapScope } from './bootstrap.queryKeys';

export const bootstrapQueryOptions = (scope?: BootstrapScope) =>
  queryOptions({
    queryKey: bootstrapQueryKeys.data(scope),
    queryFn: getBootstrapData,
    staleTime: Infinity,
  });
