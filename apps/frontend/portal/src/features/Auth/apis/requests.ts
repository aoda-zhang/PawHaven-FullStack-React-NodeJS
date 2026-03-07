import type { CredentialsDto, JwtVerifyInfo } from '@pawhaven/shared/types';

import type { ProfileType } from '../types';

import { apiClient } from '@/utils/apiClient';

export const register = (userInfo: CredentialsDto): Promise<ProfileType> => {
  return apiClient.post('/auth/register', userInfo);
};

export const login = (userInfo: CredentialsDto): Promise<ProfileType> => {
  return apiClient.post('/auth/login', userInfo);
};

export const verify = (): Promise<JwtVerifyInfo> => {
  return apiClient.get('/auth/verify');
};
