import type { AnimalFollowResult } from '@pawhaven/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { followAnimal, unfollowAnimal } from './animalFollow.api';
import { animalFollowQueryKeys } from './animalFollow.queryKeys';

const useFollowStatusMutation = (
  mutationFn: (animalId: string) => Promise<AnimalFollowResult>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      queryClient.setQueryData(
        animalFollowQueryKeys.status(result.animalId),
        result,
      );
    },
  });
};

export const useFollowAnimal = () => useFollowStatusMutation(followAnimal);

export const useUnfollowAnimal = () => useFollowStatusMutation(unfollowAnimal);
