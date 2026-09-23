import { queryOptions, useQuery } from '@tanstack/react-query';

import { getFollowStatus } from './animalFollow.api';
import { animalFollowQueryKeys } from './animalFollow.queryKeys';

export const followStatusQueryOptions = (animalId: string) =>
  queryOptions({
    queryKey: animalFollowQueryKeys.status(animalId),
    queryFn: () => getFollowStatus(animalId),
    enabled: !!animalId,
  });

export const useFollowStatus = (animalId: string) =>
  useQuery(followStatusQueryOptions(animalId));
