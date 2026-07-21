import { useQuery } from '@tanstack/react-query';

import { rescueDetailQueryKeys } from './rescueDetail.queryKeys';

import { getAnimalDetail } from '@/features/Animal/animal.api';

export const useFetchAnimalDetail = (animalId: number) => {
  return useQuery({
    queryKey: rescueDetailQueryKeys.detail(animalId),
    queryFn: () => getAnimalDetail(animalId),
    enabled: !!animalId,
  });
};
