import { routePaths } from '@/router/routePaths';

export const reportAnimalRoute = {
  path: routePaths.reportAnimal,
  lazy: async () => {
    const { ReportAnimal } =
      await import('@/features/report-animal/ReportAnimal');
    return { Component: ReportAnimal };
  },
};
