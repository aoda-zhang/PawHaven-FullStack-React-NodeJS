export const rescueDetailQueryKeys = {
  all: ['rescueDetail'] as const,
  detail: (id: string) => [...rescueDetailQueryKeys.all, 'detail', id] as const,
  followStatus: (animalId: string) =>
    [...rescueDetailQueryKeys.all, 'followStatus', animalId] as const,
};
