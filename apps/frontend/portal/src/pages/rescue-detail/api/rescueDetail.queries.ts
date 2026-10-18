import { queryOptions, useQuery } from '@tanstack/react-query';

import { getFollowStatus, getRescueDetail } from './rescueDetail.api';
import { rescueDetailQueryKeys } from './rescueDetail.queryKeys';

export const rescueDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: rescueDetailQueryKeys.detail(id),
    queryFn: () => getRescueDetail(id),
  });

export const followStatusQueryOptions = (animalId: string) =>
  queryOptions({
    queryKey: rescueDetailQueryKeys.followStatus(animalId),
    queryFn: () => getFollowStatus(animalId),
    enabled: !!animalId,
    select: (data) => ({
      isFollowing: data.isFollowing,
      followerCount: data.followerCount,
    }),
  });

export const useFollowStatus = (animalId: string) =>
  useQuery(followStatusQueryOptions(animalId));
