import type { HomeData } from '@pawhaven/shared/types';

import { apiClient } from '@/shared/utils/apiClient';

export const getHomeData = async (): Promise<HomeData> => {
  return apiClient.get<HomeData>('core/home');
};
