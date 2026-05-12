import type { AnimalReportDto } from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

export interface CreateReportStrayResponse {
  id: string;
  animalID: string;
  name: string;
}

export const createReportStray = (
  data: AnimalReportDto,
): Promise<CreateReportStrayResponse> => {
  return apiClient.post('/core/report-stray', data);
};
