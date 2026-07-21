import type {
  ApiResponse,
  CreateReportStrayRequest,
  CreateReportStrayResponse,
} from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

export const createReportStray = async (data: CreateReportStrayRequest) => {
  const response = await apiClient.post<ApiResponse<CreateReportStrayResponse>>(
    '/fe-api/v1/report-stray',
    data,
  );
  return response.data.data;
};
