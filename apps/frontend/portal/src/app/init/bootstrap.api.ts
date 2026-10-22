import {
  BootstrapDataSchema,
  type BootstrapData,
} from '@pawhaven/shared/types';

import { apiClient } from '@/shared/utils/apiClient';

export const getBootstrapData = async (): Promise<BootstrapData> => {
  const data = await apiClient.get<unknown>('core/bootstrap');
  return BootstrapDataSchema.parse(data);
};
