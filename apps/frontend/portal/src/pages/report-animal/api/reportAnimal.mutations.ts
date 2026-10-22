import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createReportAnimal } from './reportAnimal.api';

import { sharedQueryKeys } from '@/shared/constants/sharedQueryKeys';

export const useCreateReportAnimal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['reportAnimal', 'create'],
    mutationFn: createReportAnimal,
    meta: { isShowClientError: true },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sharedQueryKeys.rescueCases.all(),
      });
      queryClient.invalidateQueries({ queryKey: sharedQueryKeys.home.all() });
    },
  });
};
