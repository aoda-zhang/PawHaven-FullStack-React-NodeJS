export const homeQueryKeys = {
  all: ['home'] as const,
  latestRescues: () => [...homeQueryKeys.all, 'latestRescues'] as const,
};
