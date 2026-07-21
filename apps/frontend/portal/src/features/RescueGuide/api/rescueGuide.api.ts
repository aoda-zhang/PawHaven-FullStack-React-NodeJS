import { apiClient } from '@/utils/apiClient';

export const getRescueGuideDocs = () => {
  return apiClient.download('/document/rescue/guide');
};
