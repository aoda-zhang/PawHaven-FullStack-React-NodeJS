import { useQuery } from '@tanstack/react-query';

// import { getAnimalDetail } from './request';

const queryKeys = {
  all: ['rescueDetail'] as const,
  animalDetail: (id: string) => [...queryKeys.all, 'animalDetail', id] as const,
};

export const rescueDetailQueryKeys = queryKeys;

const getAnimalDetailQueryOptions = (id: string) => ({
  queryKey: queryKeys.animalDetail(id),
  // queryFn: () => getAnimalDetail(id),
  enabled: !!id,
});

export const useFetchAnimalDetail = (id: string) => {
  return useQuery(getAnimalDetailQueryOptions(id));
};
