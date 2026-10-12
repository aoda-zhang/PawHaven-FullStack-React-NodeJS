import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';

import { httpHeaders } from '../constants/httpHeaders.js';
import { readHeader } from '../utils/readHeader.js';

export interface TraceStore {
  traceId: string;
}

/**
 * Upper bound for an inbound trace id. `x-trace-id` is echoed straight back on
 * the response, so an unbounded caller-supplied value would let a client pad
 * every response header for free.
 */
const TRACE_ID_MAX_LENGTH = 64;

/**
 * Deliberately narrower than RFC 7230 `token`: the value is reflected into a
 * response header, and `res.setHeader` throws on CR/LF, so anything that could
 * smuggle a second header (or blow up the response) is rejected outright rather
 * than sanitized.
 */
const SAFE_TRACE_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

const storage = new AsyncLocalStorage<TraceStore>();

/**
 * Whether a value is safe to adopt as the trace id for this request. Rejects
 * empty, oversized, and non-token values.
 */
export const isValidTraceId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= TRACE_ID_MAX_LENGTH &&
  SAFE_TRACE_ID_PATTERN.test(value);

export const generateTraceId = (): string => randomUUID();

/**
 * Reuses the caller's `x-trace-id` when it is safe to do so, otherwise mints a
 * fresh one. This is the single place the inbound contract is decided — the
 * gateway proxy and the trace middleware both defer to it so a request can never
 * end up with two different ids.
 */
export const resolveInboundTraceId = (headers: IncomingHttpHeaders): string => {
  const existing = readHeader(headers, httpHeaders.traceId);
  return isValidTraceId(existing) ? existing : generateTraceId();
};

/**
 * Runs `fn` with `traceId` as the ambient trace id. Everything reached
 * synchronously from `fn` — and every async continuation spawned inside it —
 * can read the id back via {@link getTraceId}.
 */
export const runWithTrace = <T>(traceId: string, fn: () => T): T =>
  storage.run({ traceId }, fn);

export const getTraceStore = (): TraceStore | undefined => storage.getStore();

export const getTraceId = (): string | undefined => storage.getStore()?.traceId;

/**
 * Trace id for non-request contexts (cron jobs, queue consumers, bootstrap)
 * where no ambient store exists. Never returns undefined, so call sites can
 * embed it in a log line unconditionally.
 */
export const getTraceIdOr = (fallback: string): string =>
  getTraceId() ?? fallback;
