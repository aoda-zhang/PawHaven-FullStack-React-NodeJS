export const animalFollowQueryKeys = {
  all: ['animalFollow'] as const,
  status: (animalId: string) =>
    [...animalFollowQueryKeys.all, 'status', animalId] as const,
};
