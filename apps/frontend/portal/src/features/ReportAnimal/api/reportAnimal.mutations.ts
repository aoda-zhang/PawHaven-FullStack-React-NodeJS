import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createReportAnimal } from './reportAnimal.api';

import { homeQueryKeys } from '@/features/Home/api/home.queryKeys';
import { landingQueryKeys } from '@/features/Landing/api/landing.queryKeys';
import { rescueCasesQueryKeys } from '@/features/RescueCases/api/rescueCases.queryKeys';

export const useCreateReportAnimal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReportAnimal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rescueCasesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: homeQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: landingQueryKeys.all });
    },
  });
};
