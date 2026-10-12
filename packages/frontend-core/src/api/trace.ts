/**
 * Tracks the most recent server-assigned trace id.
 *
 * The API client's response interceptor unwraps the success envelope and
 * returns bare payloads, so a caller has no way to reach the `x-trace-id`
 * response header. Keeping the latest value module-scoped gives the UI
 * something to show in an error state without threading a header through every
 * api method's return type.
 *
 * Header name mirrors `httpHeaders.traceId` in `packages/backend-core`.
 */
const TRACE_ID_HEADER = 'x-trace-id';

let lastTraceId: string | null = null;

const readHeader = (headers: unknown): string | null => {
  if (!headers || typeof headers !== 'object') {
    return null;
  }

  const candidate = (headers as Record<string, unknown>)[TRACE_ID_HEADER];
  return typeof candidate === 'string' && candidate.length > 0
    ? candidate
    : null;
};

/**
 * Records the trace id from a response, if it carries one. Safe to call for
 * every response; a missing header simply leaves the previous value in place
 * rather than clearing it mid-flight.
 */
export const recordTraceId = (response: unknown): string | null => {
  const traceId =
    readHeader((response as { headers?: unknown } | null)?.headers) ??
    readHeader(
      (response as { data?: { headers?: unknown } } | null)?.data?.headers,
    );

  if (traceId) {
    lastTraceId = traceId;
  }

  return lastTraceId;
};

/** The most recent trace id seen, or null before the first response. */
export const getLastTraceId = (): string | null => lastTraceId;

/** Test seam. */
export const resetLastTraceId = (): void => {
  lastTraceId = null;
};
