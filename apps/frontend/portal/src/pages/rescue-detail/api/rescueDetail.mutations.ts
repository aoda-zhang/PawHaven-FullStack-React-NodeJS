import type { AnimalFollowResult } from '@pawhaven/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { followAnimal, unfollowAnimal } from './rescueDetail.api';
import { rescueDetailQueryKeys } from './rescueDetail.queryKeys';

const useFollowStatusMutation = (
  mutationFn: (animalId: string) => Promise<AnimalFollowResult>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      queryClient.setQueryData(
        rescueDetailQueryKeys.followStatus(result.animalId),
        result,
      );
    },
  });
};

export const useFollowAnimal = () => useFollowStatusMutation(followAnimal);

export const useUnfollowAnimal = () => useFollowStatusMutation(unfollowAnimal);
