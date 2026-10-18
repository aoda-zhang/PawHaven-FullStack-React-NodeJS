import type { CredentialsDto, SessionDto } from '@pawhaven/shared/types';

import { apiClient } from '@/shared/utils/apiClient';

export const postLogin = async (
  loginRequest: CredentialsDto,
): Promise<SessionDto> => {
  return apiClient.post<SessionDto>('/auth/login', loginRequest);
};

export const postRegister = async (
  registerRequest: CredentialsDto,
): Promise<SessionDto> => {
  return apiClient.post<SessionDto>('/auth/register', registerRequest);
};

export const postLogout = async (): Promise<{ message: string }> => {
  return apiClient.post<{ message: string }>('/auth/logout');
};
