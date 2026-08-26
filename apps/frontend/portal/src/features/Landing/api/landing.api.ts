import type { HeroStats, MenuItem, RouterItem } from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

export interface HomeData {
  menus: MenuItem[];
  routers: RouterItem[];
  heroStats: HeroStats;
}

export const getHomeData = async (): Promise<HomeData> => {
  return apiClient.get<HomeData>('core/home');
};
