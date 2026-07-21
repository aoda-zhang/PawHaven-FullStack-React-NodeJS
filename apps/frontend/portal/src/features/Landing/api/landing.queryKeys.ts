export const landingQueryKeys = {
  all: ['landing'] as const,
  bootstrap: () => [...landingQueryKeys.all, 'bootstrap'] as const,
};
