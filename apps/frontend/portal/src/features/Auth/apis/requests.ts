import type { CredentialsDto } from '@pawhaven/shared/types';

import type { ProfileType } from '../types';

import { apiClient } from '@/utils/apiClient';

export const register = (userInfo: CredentialsDto): Promise<ProfileType> => {
  return apiClient.post('/auth/register', userInfo);
};

export const login = (userInfo: CredentialsDto): Promise<ProfileType> => {
  return apiClient.post('/auth/login', userInfo);
};
