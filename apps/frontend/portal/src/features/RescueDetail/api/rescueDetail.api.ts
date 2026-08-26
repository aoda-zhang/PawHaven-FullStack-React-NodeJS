import type { AnimalDetail } from '@/types/AnimalType';
import { apiClient } from '@/utils/apiClient';

export const getRescueDetail = (id: string): Promise<AnimalDetail> => {
  return apiClient.get(`/core/rescues/${id}`);
};
