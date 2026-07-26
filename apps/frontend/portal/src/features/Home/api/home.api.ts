import type { RescueItem } from '@pawhaven/shared/types';

import { heroStatValues, mockAdoptablePets } from '../mockData';
import type { AdoptablePet } from '../types';

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

export const getAdoptablePets = async (): Promise<AdoptablePet[]> => {
  try {
    return await apiClient.get<AdoptablePet[]>('/adoptable-pets');
  } catch {
    return mockAdoptablePets;
  }
};
