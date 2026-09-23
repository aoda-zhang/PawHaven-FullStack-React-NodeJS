import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createReportAnimal } from './reportAnimal.api';

import { homeQueryKeys } from '@/features/home/api/home.queryKeys';
import { rescueCasesQueryKeys } from '@/features/rescue-cases/api/rescueCases.queryKeys';

export const useCreateReportAnimal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReportAnimal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rescueCasesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: homeQueryKeys.all });
    },
  });
};
