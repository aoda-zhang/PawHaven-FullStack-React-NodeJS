import {
  RescueListItemSchema,
  type RescueListItem,
} from '@pawhaven/shared/types';

import { apiClient } from '@/shared/utils/apiClient';

export const fetchRescueCases = async (
  limit?: number,
): Promise<RescueListItem[]> => {
  const data = await apiClient.get<unknown>(
    '/core/rescues',
    limit ? { limit } : undefined,
  );
  return RescueListItemSchema.array().parse(data);
};

export const fetchRescueCaseById = async (
  id: string,
): Promise<RescueListItem> => {
  const data = await apiClient.get<unknown>(`/core/rescues/${id}`);
  return RescueListItemSchema.parse(data);
};
