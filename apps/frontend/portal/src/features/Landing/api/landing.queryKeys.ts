export interface BootstrapScope {
  userID: string;
  menuUpdateAt: string;
  routerUpdateAt: string;
}

export const landingQueryKeys = {
  all: ['landing'] as const,
  bootstrap: (scope?: BootstrapScope) =>
    [...landingQueryKeys.all, 'bootstrap', ...(scope ? [scope] : [])] as const,
};
