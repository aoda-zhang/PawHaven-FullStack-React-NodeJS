import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { getLocale } from '../utils/locale/getLocale';

import { getUTCTimestamp } from './encrypt';
import { normalizeHttpError } from './errorHandle';
import { recordTraceId } from './trace';
import type { ApiClientOptions, ApiResponseType } from './types';
import { RequestMode } from './types';

/**
 * Configuration options for creating an API client instance.
 */

interface BinaryRequestConfig extends AxiosRequestConfig {
  bypassEnvelope?: boolean;
}

const bypassesEnvelope = (config?: AxiosRequestConfig): boolean =>
  Boolean((config as BinaryRequestConfig | undefined)?.bypassEnvelope);

/**
 * Factory function to create a reusable API client with common interceptors and headers.
 */
export const createApiClient = (options: ApiClientOptions) => {
  const {
    baseURL = '/api',
    timeout = 20000,
    withCredentials = true,
    requestMode = RequestMode.http,
  } = options as ApiClientOptions & {
    requestMode?: keyof typeof RequestMode;
  };

  const Http: AxiosInstance = axios.create({
    baseURL,
    timeout,
    withCredentials,
  });

  const getHttpHeaders = () => {
    const timestamp = `${getUTCTimestamp()}`;
    const headers: Record<string, string> = {
      'X-timestamp': timestamp,
      'X-locale': getLocale(),
    };

    if (requestMode === RequestMode.http) {
      headers.Accept = 'application/json';
    }

    return headers;
  };

  // ✅ Request interceptor with proper typing
  Http.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      Object.assign(config.headers ?? {}, getHttpHeaders());
      return config;
    },
    (error) => {
      return Promise.reject(normalizeHttpError(error));
    },
  );

  // ✅ Response interceptor
  Http.interceptors.response.use(
    (response: AxiosResponse<ApiResponseType>) => {
      // Recorded before the envelope is unwrapped below, because that step
      // discards the headers — the only place the trace id lives on a success.
      recordTraceId(response);

      if (
        requestMode === RequestMode.resource ||
        bypassesEnvelope(response.config)
      ) {
        return response;
      }

      if (
        response?.data?.status >= 200 &&
        response?.data?.status < 400 &&
        response?.data?.isSuccess
      ) {
        return response.data.data as AxiosResponse<ApiResponseType>;
      }

      return Promise.reject(normalizeHttpError(response.data));
    },
    (error) => {
      return Promise.reject(normalizeHttpError(error));
    },
  );

  return {
    get<T, P = Record<string, unknown>>(
      url: string,
      params?: P,
      config?: AxiosRequestConfig,
    ): Promise<T> {
      return Http.get(url, { params, ...config }) as Promise<T>;
    },
    delete<T, P = Record<string, unknown>>(
      url: string,
      params?: P,
      config?: AxiosRequestConfig,
    ): Promise<T> {
      return Http.delete(url, { params, ...config }) as Promise<T>;
    },
    post<T, D = Record<string, unknown>>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig,
    ): Promise<T> {
      return Http.post(url, data, { ...config }) as Promise<T>;
    },
    put<T, D = Record<string, unknown>>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig,
    ): Promise<T> {
      return Http.put(url, data, { ...config }) as Promise<T>;
    },
    download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
      const binaryRequest: BinaryRequestConfig = {
        responseType: 'blob',
        transformResponse: (r) => r,
        bypassEnvelope: true,
        ...config,
      };

      return Http.get(url, binaryRequest).then(
        (res: AxiosResponse<Blob>) => res.data,
      );
    },
    postBlob<D = Record<string, unknown>>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig,
    ): Promise<Blob> {
      const binaryRequest: BinaryRequestConfig = {
        responseType: 'blob',
        transformResponse: (r) => r,
        bypassEnvelope: true,
        ...config,
      };

      return Http.post(url, data, binaryRequest).then(
        (res: AxiosResponse<Blob>) => res.data,
      );
    },
  };
};
