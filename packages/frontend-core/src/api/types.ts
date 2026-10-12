export const httpRequestErrors = {
  // Authentication
  AUTH: 'AUTH',
  PERMISSION: 'PERMISSION',
  // Client
  RATELIMIT: 'RATELIMIT',
  BADREQUEST: 'BADREQUEST',
  // Server
  SERVER: 'SERVER',
  MAINTENANCE: 'MAINTENANCE',
  UNKNOWN: 'UNKNOWN',
  // Network
  NETWORK: 'NETWORK',
} as const;

export const RequestMode = {
  http: 'http',
  resource: 'resource',
} as const;

export interface ApiClientOptions {
  baseURL?: string; // The base URL for API requests
  timeout?: number; // Optional request timeout
  enableSign?: boolean; // Whether to use signature validation
  prefix?: string; // endpoint prefix
  withCredentials?: boolean; // Is send cookies to backend automatically
  requestMode?: keyof typeof RequestMode;
}

export type HttpRequestErrorType =
  (typeof httpRequestErrors)[keyof typeof httpRequestErrors];
export interface ApiErrorInfo {
  type: HttpRequestErrorType;
  status?: number;
  data?: Record<string, unknown>;
  raw?: unknown;
  code: string;
  /**
   * Server correlation id for the failed request, shown to the user so a bug
   * report can be tied to specific backend logs.
   */
  traceId?: string | null;
}

export interface ApiResponseType {
  type?: HttpRequestErrorType;
  data: unknown;
  isSuccess: boolean;
  message: string;
  status: number;
  code: string;
}

export enum extraRequestHeader {
  'access-token' = 'access-token',
  refreshToken = 'refreshToken',
}
