import { HomeDataSchema, type HomeData } from '@pawhaven/shared/types';

import { apiClient } from '@/shared/utils/apiClient';

export const getHomeData = async (): Promise<HomeData> => {
  const data = await apiClient.get<unknown>('core/home');
  return HomeDataSchema.parse(data);
};
