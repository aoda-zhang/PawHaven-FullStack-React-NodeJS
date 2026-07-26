export const homeQueryKeys = {
  all: ['home'] as const,
  latestRescues: () => [...homeQueryKeys.all, 'latestRescues'] as const,
  heroStats: () => [...homeQueryKeys.all, 'heroStats'] as const,
};
