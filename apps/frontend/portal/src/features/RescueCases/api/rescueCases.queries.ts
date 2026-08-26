import { useQuery } from '@tanstack/react-query';

import { fetchRescueCaseById, fetchRescueCases } from './rescueCases.api';
import { rescueCasesQueryKeys } from './rescueCases.queryKeys';

export const useFetchRescueCases = () => {
  return useQuery({
    queryKey: rescueCasesQueryKeys.all,
    queryFn: () => fetchRescueCases(),
  });
};

export const useFetchRescueCase = (id: string) => {
  return useQuery({
    queryKey: rescueCasesQueryKeys.detail(id),
    queryFn: () => fetchRescueCaseById(id),
    enabled: !!id,
  });
};
