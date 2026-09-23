import type { AnimalReportDto } from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

export interface CreateReportAnimalResult {
  id: string;
}

export const createReportAnimal = async (
  data: AnimalReportDto,
): Promise<CreateReportAnimalResult> => {
  return apiClient.post<CreateReportAnimalResult>('/core/report-animal', data);
};
