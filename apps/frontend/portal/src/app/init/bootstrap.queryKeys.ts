export interface BootstrapScope {
  userID: string;
  menuUpdateAt: string;
}

export const bootstrapQueryKeys = {
  all: ['bootstrap'] as const,
  data: (scope?: BootstrapScope) =>
    [...bootstrapQueryKeys.all, 'data', ...(scope ? [scope] : [])] as const,
};
