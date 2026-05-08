import type { RescueItem } from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

export const getLatestRescuesByNumber = (): Promise<RescueItem[]> => {
  return apiClient.get('/core/rescues');
};

export const getLatestStories = (): Promise<RescueItem[]> => {
  return apiClient.get('/core/rescues');
};
