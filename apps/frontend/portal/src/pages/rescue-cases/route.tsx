import { routePaths } from '@/app/router/routePaths';

export const rescueCasesRoute = {
  path: routePaths.rescueCases,
  lazy: async () => {
    const { RescueCasesPage } = await import('@/pages/rescue-cases');
    return { Component: RescueCasesPage };
  },
};
