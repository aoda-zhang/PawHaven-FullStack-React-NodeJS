import type { AnimalReportSchemaType } from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

export const reportStray = (
  data: AnimalReportSchemaType,
): Promise<{ message: string; id: string }> => {
  return apiClient.post('/core/report-stray', data);
};
