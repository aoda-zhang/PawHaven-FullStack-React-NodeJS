import type { AnimalFollowResult } from '@pawhaven/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { followAnimal, unfollowAnimal } from './rescueDetail.api';
import { rescueDetailQueryKeys } from './rescueDetail.queryKeys';

const useFollowStatusMutation = (
  mutationFn: (animalId: string) => Promise<AnimalFollowResult>,
  type: 'follow' | 'unfollow',
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['animalFollow', type],
    mutationFn,
    onMutate: async (animalId) => {
      await queryClient.cancelQueries({
        queryKey: rescueDetailQueryKeys.followStatus(animalId),
      });
      const previous = queryClient.getQueryData<AnimalFollowResult>(
        rescueDetailQueryKeys.followStatus(animalId),
      );
      queryClient.setQueryData<AnimalFollowResult>(
        rescueDetailQueryKeys.followStatus(animalId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            isFollowed: type === 'follow',
            followerCount:
              type === 'follow' ? old.followerCount + 1 : old.followerCount - 1,
          };
        },
      );
      return { previous };
    },
    onError: (_err, animalId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          rescueDetailQueryKeys.followStatus(animalId),
          context.previous,
        );
      }
    },
    onSettled: (data, _err, animalId) => {
      if (data) {
        queryClient.setQueryData(
          rescueDetailQueryKeys.followStatus(animalId),
          data,
        );
      }
    },
  });
};

export const useFollowAnimal = () =>
  useFollowStatusMutation(followAnimal, 'follow');

export const useUnfollowAnimal = () =>
  useFollowStatusMutation(unfollowAnimal, 'unfollow');
