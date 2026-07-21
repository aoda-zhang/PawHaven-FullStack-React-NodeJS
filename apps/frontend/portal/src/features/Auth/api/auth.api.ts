import type {
  ApiResponse,
  CaptchaRequest,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  UserProfileResponse,
} from '@pawhaven/shared/types';
import type { AxiosRequestConfig } from 'axios';

import { apiClient } from '@/utils/apiClient';

export const refreshToken = async (config: AxiosRequestConfig) => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    '/fe-api/v1/auth/refresh',
    {},
    config ? { ...config, _retry: true } : undefined,
  );
  return response.data.data;
};

export const getCaptcha = async (params: CaptchaRequest) => {
  const response = await apiClient.get<ApiResponse<Blob>>(
    '/fe-api/v1/auth/captcha',
    { params, responseType: 'blob' },
  );
  return response.data.data;
};

export const postLogin = async (loginRequest: LoginRequest) => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    '/fe-api/v1/auth/login',
    loginRequest,
  );
  return response.data.data;
};

export const postRegister = async (registerRequest: RegisterRequest) => {
  const response = await apiClient.post<ApiResponse<RegisterResponse>>(
    '/fe-api/v1/auth/register',
    registerRequest,
  );
  return response.data.data;
};

export const getUserCurrent = async () => {
  const response = await apiClient.get<ApiResponse<UserProfileResponse>>(
    '/fe-api/v1/auth/current',
  );
  return response.data.data;
};

export const deleteLogout = async () => {
  const response = await apiClient.delete<ApiResponse<LogoutResponse>>(
    '/fe-api/v1/auth/logout',
  );
  return response.data.data;
};
