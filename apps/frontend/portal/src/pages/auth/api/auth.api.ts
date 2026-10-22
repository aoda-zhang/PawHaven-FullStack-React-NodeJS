import {
  SessionSchema,
  type CredentialsDto,
  type SessionDto,
} from '@pawhaven/shared/types';

import { apiClient } from '@/shared/utils/apiClient';

export const postLogin = async (
  loginRequest: CredentialsDto,
): Promise<SessionDto> => {
  const data = await apiClient.post<unknown>('/auth/login', loginRequest);
  return SessionSchema.parse(data);
};

export const postRegister = async (
  registerRequest: CredentialsDto,
): Promise<SessionDto> => {
  const data = await apiClient.post<unknown>('/auth/register', registerRequest);
  return SessionSchema.parse(data);
};

export const postLogout = async (): Promise<{ message: string }> => {
  return apiClient.post<{ message: string }>('/auth/logout');
};
