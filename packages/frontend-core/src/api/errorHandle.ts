import { httpBusinessMappingCodes, HTTP_STATUS } from '@pawhaven/shared';
import { isAxiosError } from 'axios';

import {
  type ApiErrorInfo,
  httpRequestErrors,
  type HttpRequestErrorType,
} from './types';

interface ErrorResponse {
  status?: number | null;
  code?: string | null;
  message?: string | null;
  headers?: Record<string, string | string[] | undefined>;
}

type ErrorHeaders = Record<string, string | string[] | undefined>;

/**
 * Header carrying the server-side correlation id. Mirrors
 * `httpHeaders.traceId` in `packages/backend-core`; duplicated as a literal
 * because the frontend must not depend on a backend package.
 */
const TRACE_ID_HEADER = 'x-trace-id';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readHeaders = (value: unknown): ErrorHeaders | null => {
  if (!isRecord(value)) return null;

  const headers: ErrorHeaders = {};
  Object.entries(value).forEach(([key, headerValue]) => {
    if (typeof headerValue === 'string') {
      headers[key] = headerValue;
    } else if (
      Array.isArray(headerValue) &&
      headerValue.every((item) => typeof item === 'string')
    ) {
      headers[key] = headerValue;
    }
  });

  return headers;
};

/**
 * Reads the trace id from a response, preferring the header and falling back to
 * the body field that downstream services set on error envelopes.
 */
export const readTraceId = (
  headers?: Record<string, unknown> | null,
  body?: unknown,
): string | null => {
  const fromHeader = headers?.[TRACE_ID_HEADER];
  if (typeof fromHeader === 'string' && fromHeader.length > 0) {
    return fromHeader;
  }

  const fromBody = (body as { traceId?: unknown } | null | undefined)?.traceId;
  return typeof fromBody === 'string' && fromBody.length > 0 ? fromBody : null;
};

/**
 * Helper to check if error response matches a given status and one of the provided codes
 */
const matchesStatusAndCode = (
  errorRes: ErrorResponse,
  status: number,
  codes: Array<string | null | undefined>,
): boolean => {
  if (!errorRes) return false;
  const { status: errStatus, code: errCode } = errorRes;
  return errStatus === status && codes.includes(errCode ?? null);
};

/**
 * Check if the error is an authentication-related error (e.g., JWT expired, unauthorized)
 * Multi-layer detection:
 * 1. Status + code
 * 2. Message content
 * 3. Response header 'www-authenticate'
 * 4. Optional local token state
 */
const isAuthError = (errorRes: ErrorResponse): boolean => {
  if (!errorRes) return false;

  if (errorRes.status === HTTP_STATUS.UNAUTHORIZED) {
    return true;
  }

  // 1. Status + code
  if (
    matchesStatusAndCode(errorRes, HTTP_STATUS.UNAUTHORIZED, [
      httpBusinessMappingCodes.jwtExpired,
      httpBusinessMappingCodes.unauthorized,
    ])
  ) {
    return true;
  }

  // 2. Message content
  if (
    typeof errorRes.message === 'string' &&
    (errorRes.message.toLowerCase().includes('jwt expired') ||
      errorRes.message.toLowerCase().includes('unauthorized'))
  ) {
    return true;
  }
  return false;
};

/**
 * Check if the error is a permission (forbidden) error
 * Multi-layer detection:
 * 1. Status + code
 * 2. Message content
 */
const isPermissionError = (errorRes: ErrorResponse): boolean => {
  if (!errorRes) return false;

  if (errorRes.status === HTTP_STATUS.FORBIDDEN) {
    return true;
  }

  // 1. Status + code
  if (
    matchesStatusAndCode(errorRes, HTTP_STATUS.FORBIDDEN, [
      httpBusinessMappingCodes.forbidden,
    ])
  ) {
    return true;
  }

  // 2. Message content
  if (
    typeof errorRes.message === 'string' &&
    errorRes.message.toLowerCase().includes('forbidden')
  ) {
    return true;
  }

  return false;
};

/**
 * Check if the error indicates the client has hit the API rate limit
 */
const isRateLimit = (errorRes: ErrorResponse): boolean => {
  if (!errorRes) return false;
  const { status } = errorRes;
  return status === HTTP_STATUS.TOO_MANY_REQUESTS;
};

/**
 * Check if the error is a bad request (client-side input error)
 */
const isBadRequest = (errorRes: ErrorResponse): boolean => {
  if (!errorRes) return false;
  return errorRes.status === HTTP_STATUS.BAD_REQUEST;
};

/**
 * Check if the error is a server-side internal error
 */
const isServerError = (errorRes: ErrorResponse): boolean => {
  if (!errorRes) return false;
  const { status } = errorRes;
  return (
    typeof status === 'number' && status >= HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
};

/**
 * Check if the server is temporarily unavailable (maintenance)
 */
const isMaintenance = (errorRes: ErrorResponse): boolean => {
  if (!errorRes) return false;
  if (errorRes.status === HTTP_STATUS.SERVICE_UNAVAILABLE) return true;

  const { message } = errorRes;
  return (
    typeof message === 'string' && message.toLowerCase().includes('maintenance')
  );
};

/**
 * Map the response error to a corresponding httpRequestErrors type
 */
const mapErrorToType = (errorRes: ErrorResponse): HttpRequestErrorType => {
  if (isAuthError(errorRes)) return httpRequestErrors.AUTH;
  if (isPermissionError(errorRes)) return httpRequestErrors.PERMISSION;
  if (isBadRequest(errorRes)) return httpRequestErrors.BADREQUEST;
  if (isRateLimit(errorRes)) return httpRequestErrors.RATELIMIT;
  if (isMaintenance(errorRes)) return httpRequestErrors.MAINTENANCE;
  if (isServerError(errorRes)) return httpRequestErrors.SERVER;
  return httpRequestErrors.UNKNOWN;
};

/**
 * Normalize various axios and non-axios error shapes into a unified format.
 */
export const normalizeHttpError = (error: unknown): ApiErrorInfo => {
  let errorType: HttpRequestErrorType = httpRequestErrors.UNKNOWN;
  let errorStatus: number | null = null;
  let errorCode: string | null = null;
  let errorMessage: string | null = null;
  let errorHeaders: ErrorHeaders | null = null;
  // Correlation id for the failed request, so a user can quote it in a bug
  // report. Read from the response headers, falling back to the error body.
  let errorTraceId: string | null = null;

  if (isAxiosError(error)) {
    const { response } = error;
    const data = isRecord(response?.data) ? response.data : null;

    errorStatus = response?.status ?? null;
    errorCode =
      typeof data?.code === 'string' ? data.code : (error.code ?? null);
    errorMessage =
      typeof data?.message === 'string' ? data.message : error.message;
    errorHeaders = readHeaders(response?.headers);
    errorTraceId = readTraceId(errorHeaders, data ?? error);

    if (response) {
      errorType = mapErrorToType({
        ...(data ?? {}),
        status: response.status,
        code: errorCode,
        message: errorMessage,
        headers: errorHeaders ?? undefined,
      });
    } else if ((errorMessage ?? '').toLowerCase().includes('network')) {
      errorType = httpRequestErrors.NETWORK;
    }
  } else {
    const record = isRecord(error) ? error : null;

    errorStatus = typeof record?.status === 'number' ? record.status : null;
    errorCode = typeof record?.code === 'string' ? record.code : null;
    errorMessage = typeof record?.message === 'string' ? record.message : null;
    errorHeaders = readHeaders(record?.headers);
    errorTraceId = readTraceId(errorHeaders, error);

    if ((errorMessage ?? '').toLowerCase().includes('network')) {
      errorType = httpRequestErrors.NETWORK;
    } else {
      errorType = mapErrorToType({
        status: errorStatus,
        code: errorCode,
        message: errorMessage,
        headers: errorHeaders ?? undefined,
      });
    }
  }

  return {
    type: errorType,
    status: errorStatus,
    code: errorCode,
    traceId: errorTraceId,
    raw: error,
  };
};
