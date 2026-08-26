import { useMutation } from '@tanstack/react-query';

import { createReportAnimal } from './reportAnimal.api';

export const useCreateReportAnimal = () => {
  return useMutation({
    mutationFn: createReportAnimal,
  });
};
