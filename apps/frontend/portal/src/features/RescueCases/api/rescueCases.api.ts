import type { RescueCase } from '../types';

import { apiClient } from '@/utils/apiClient';

export const fetchRescueCases = (): Promise<RescueCase[]> => {
  return apiClient.get<RescueCase[]>('/rescue-cases');
};

export const fetchRescueCaseById = (id: string): Promise<RescueCase> => {
  return apiClient.get<RescueCase>(`/rescue-cases/${id}`);
};
