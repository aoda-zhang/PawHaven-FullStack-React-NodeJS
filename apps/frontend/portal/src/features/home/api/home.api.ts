import type { HomeData } from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

export const getHomeData = async (): Promise<HomeData> => {
  return apiClient.get<HomeData>('core/home');
};
