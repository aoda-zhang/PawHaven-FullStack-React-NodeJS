import { routePaths } from '@/app/router/routePaths';

export const rescueGuideRoute = {
  path: routePaths.rescueGuides,
  lazy: async () => {
    const { RescueGuide } = await import('@/pages/rescue-guide');
    return { Component: RescueGuide };
  },
};
