import { routePaths } from '@/app/router/routePaths';

export const rescueDetailRoute = {
  path: routePaths.rescueCaseDetail,
  lazy: async () => {
    const { RescueDetail } = await import('@/pages/rescue-detail');
    return { Component: RescueDetail };
  },
};
