/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { httpBusinessMappingCodes, HTTP_STATUS } from '@pawhaven/shared';

import { httpRequestErrors } from './types';

interface ErrorResponse {
  status?: number | null;
  code?: string | null;
  message?: string | null;
  headers?: Record<string, string | string[] | undefined>;
  // Optional token state to check local token presence
  hasLocalToken?: boolean;
}

/**
 * Header carrying the server-side correlation id. Mirrors
 * `httpHeaders.traceId` in `packages/backend-core`; duplicated as a literal
 * because the frontend must not depend on a backend package.
 */
const TRACE_ID_HEADER = 'x-trace-id';

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
const isBadRequest = (errorRes: ErrorResponse): boolean =>
  matchesStatusAndCode(errorRes, HTTP_STATUS.BAD_REQUEST, [
    httpBusinessMappingCodes.validationError,
  ]);

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
  const { message } = errorRes;
  return (
    typeof message === 'string' && message.toLowerCase().includes('maintenance')
  );
};

/**
 * Map the response error to a corresponding httpRequestErrors type
 */
const mapErrorToType = (errorRes: ErrorResponse) => {
  if (isAuthError(errorRes)) return httpRequestErrors.AUTH;
  if (isPermissionError(errorRes)) return httpRequestErrors.PERMISSION;
  if (isBadRequest(errorRes)) return httpRequestErrors.BADREQUEST;
  if (isRateLimit(errorRes)) return httpRequestErrors.RATELIMIT;
  if (isMaintenance(errorRes)) return httpRequestErrors.MAINTENANCE;
  if (isServerError(errorRes)) return httpRequestErrors.SERVER;
  return httpRequestErrors.UNKNOWN;
};

/**
 * Normalize various axios error shapes into a unified format
 */
export const normalizeHttpError = (error: any) => {
  let errorType = httpRequestErrors.UNKNOWN;
  let errorStatus = error?.status ?? null;
  let errorCode = error?.code ?? null;
  let errorMessage = error?.message ?? null;
  let errorHeaders = error?.response?.headers ?? null;
  // Correlation id for the failed request, so a user can quote it in a bug
  // report. Read from the response headers, falling back to the error body —
  // downstream services put it in both places.
  let errorTraceId: string | null = null;

  // Optional local token state, if available from context or error object
  const hasLocalToken = error?.hasLocalToken ?? false;

  if (error?.isAxiosError && error?.response) {
    const { response } = error;
    const { status } = response;
    const code = response?.data?.code ?? error.code;
    const message = response?.data?.message ?? error.message;
    const headers = response.headers ?? null;
    errorStatus = status;
    errorCode = code;
    errorMessage = message;
    errorHeaders = headers;
    errorTraceId = readTraceId(headers, response?.data);
    errorType = mapErrorToType({
      ...response.data,
      status: response.status,
      headers,
      hasLocalToken,
    });
  } else if (error?.message?.includes('Network')) {
    errorType = httpRequestErrors.NETWORK;
  } else {
    errorTraceId = readTraceId(errorHeaders, error);
    // For non-axios errors, try to map with available info
    errorType = mapErrorToType({
      status: errorStatus,
      code: errorCode,
      message: errorMessage,
      headers: errorHeaders,
      hasLocalToken,
    });
  }

  return {
    type: errorType,
    status: errorStatus,
    code: errorCode,
    traceId: errorTraceId,
    raw: error,
  };
};
