import type { RescueItem } from '@pawhaven/shared/types';

import { heroStatValues } from '../mockData';

import { apiClient } from '@/utils/apiClient';

export const getLatestRescuesByNumber = (): Promise<RescueItem[]> => {
  return apiClient.get('/core/rescues');
};

export const getHeroStats = async (): Promise<typeof heroStatValues> => {
  try {
    return await apiClient.get<typeof heroStatValues>('/hero-stats');
  } catch {
    return heroStatValues;
  }
};
