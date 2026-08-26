import type {
  AuthUser,
  CredentialsDto,
  SessionDto,
} from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

// apiClient (frontend-core) unwraps the ApiResponse envelope, so each function resolves directly to its business payload.
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

export const getUserCurrent = async (): Promise<AuthUser> => {
  return apiClient.get<AuthUser>('/auth/me');
};

export const postLogout = async (): Promise<{ message: string }> => {
  return apiClient.post<{ message: string }>('/auth/logout');
};
