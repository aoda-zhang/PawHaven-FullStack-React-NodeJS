import { RescueDetailSchema, type RescueDetail } from '@pawhaven/shared/types';

import { apiClient } from '@/shared/utils/apiClient';

export const getRescueDetail = async (id: string): Promise<RescueDetail> => {
  const data = await apiClient.get<unknown>(`/core/rescues/${id}`);
  return RescueDetailSchema.parse(data);
};
