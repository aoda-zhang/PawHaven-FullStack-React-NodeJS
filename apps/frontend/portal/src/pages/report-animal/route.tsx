import { routePaths } from '@/app/router/routePaths';

export const reportAnimalRoute = {
  path: routePaths.reportAnimal,
  lazy: async () => {
    const { ReportAnimal } = await import('@/pages/report-animal');
    return { Component: ReportAnimal };
  },
};
