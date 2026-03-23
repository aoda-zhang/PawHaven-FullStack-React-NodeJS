import { useQuery } from '@tanstack/react-query';

import { getAnimalDetail } from './request';

export const rescueDetailQueryKeys = {
  all: ['rescueDetail'] as const,
  animalDetail: (id: string) =>
    [...rescueDetailQueryKeys.all, 'animalDetail', id] as const,
};

const getAnimalDetailQueryOptions = (id: string) => ({
  queryKey: rescueDetailQueryKeys.animalDetail(id),
  queryFn: () => getAnimalDetail(id),
  enabled: !!id,
});

export const useFetchAnimalDetail = (id: string) => {
  return useQuery(getAnimalDetailQueryOptions(id));
};

export const useFetchRescueLine = (id: string) => {
  return useQuery({
    ...getAnimalDetailQueryOptions(id),
    select: (animalDetail) => animalDetail?.updates ?? [],
  });
};
