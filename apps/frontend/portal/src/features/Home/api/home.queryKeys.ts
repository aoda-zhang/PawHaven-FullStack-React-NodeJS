export const homeQueryKeys = {
  all: ['home'] as const,
  latestRescues: (limit: number) =>
    [...homeQueryKeys.all, 'latestRescues', limit] as const,
  adoptablePets: () => [...homeQueryKeys.all, 'adoptablePets'] as const,
};
