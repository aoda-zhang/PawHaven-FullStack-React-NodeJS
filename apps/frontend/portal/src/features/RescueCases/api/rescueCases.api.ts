import { mockRescueCases } from '../mockData';
import type { RescueCase } from '../types';

import { apiClient } from '@/utils/apiClient';

export const fetchRescueCases = async (): Promise<RescueCase[]> => {
  try {
    return await apiClient.get<RescueCase[]>('/rescue-cases');
  } catch {
    return mockRescueCases;
  }
};

export const fetchRescueCaseById = (id: string): Promise<RescueCase> => {
  return apiClient.get<RescueCase>(`/rescue-cases/${id}`);
};
