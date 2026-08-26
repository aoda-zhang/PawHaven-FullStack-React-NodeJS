import type { AdoptablePet } from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

export const getAdoptablePets = async (): Promise<AdoptablePet[]> => {
  return apiClient.get<AdoptablePet[]>('/core/adoptable-pets');
};
