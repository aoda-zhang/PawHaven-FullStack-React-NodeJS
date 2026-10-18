import type { RescueListItem } from '@pawhaven/shared/types';

import { apiClient } from '@/shared/utils/apiClient';

export const fetchRescueCases = async (
  limit?: number,
): Promise<RescueListItem[]> => {
  return apiClient.get<RescueListItem[]>(
    '/core/rescues',
    limit ? { limit } : undefined,
  );
};

export const fetchRescueCaseById = (id: string): Promise<RescueListItem> => {
  return apiClient.get<RescueListItem>(`/core/rescues/${id}`);
};
