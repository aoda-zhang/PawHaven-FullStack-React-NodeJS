import { HttpStatus } from '@nestjs/common';

export interface HttpResType {
  isSuccess: boolean;
  message: string;
  code: string;
  data: unknown;
  status: number;
  /**
   * Correlation id for the request, mirrored from the `x-trace-id` response
   * header. Present on error responses so a caller can quote it without having
   * to read headers.
   */
  traceId?: string;
}

/** Builds the shared public error envelope used by Nest handlers and gateway proxy responses. */
export const createHttpErrorResponse = (
  status: number,
  message =
    status === HttpStatus.GATEWAY_TIMEOUT ? 'Request timeout' : 'Service error',
  code = '',
  data: unknown = null,
  traceId?: string,
): HttpResType => ({
  status,
  isSuccess: false,
  message,
  code,
  data,
  ...(traceId ? { traceId } : {}),
});
