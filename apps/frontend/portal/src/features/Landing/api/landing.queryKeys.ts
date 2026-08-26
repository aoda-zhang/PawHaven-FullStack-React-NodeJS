export interface HomeScope {
  userID: string;
  menuUpdateAt: string;
  routerUpdateAt: string;
}

export const landingQueryKeys = {
  all: ['landing'] as const,
  home: (scope?: HomeScope) =>
    [...landingQueryKeys.all, 'home', ...(scope ? [scope] : [])] as const,
};
