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
