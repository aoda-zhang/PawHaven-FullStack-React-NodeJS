import { EventEmitter } from 'node:events';
import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { httpHeaders } from '../constants/httpHeaders.js';

import { getTraceId } from './traceContext.js';
import { traceMiddleware } from './trace.middleware.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const createResponse = () => {
  const emitter = new EventEmitter();
  const headers: Record<string, unknown> = {};
  const response = {
    headers,
    statusCode: 200,
    setHeader(name: string, value: unknown) {
      headers[name] = value;
      return response;
    },
    getHeader(name: string) {
      return headers[name];
    },
    on(event: string, listener: () => void) {
      emitter.on(event, listener);
      return response;
    },
    once(event: string, listener: () => void) {
      emitter.once(event, listener);
      return response;
    },
    off(event: string, listener: () => void) {
      emitter.off(event, listener);
      return response;
    },
    finish() {
      emitter.emit('finish');
    },
  };
  return response as unknown as Response & {
    headers: Record<string, unknown>;
    statusCode: number;
    finish: () => void;
  };
};

const createRequest = (headers: Record<string, string> = {}): Request =>
  ({
    method: 'GET',
    path: '/core/home',
    headers,
  }) as unknown as Request;

/**
 * Nest's `ConsoleLogger` writes straight to the process streams rather than
 * going through the `console` methods, so the spies have to target stdout and
 * stderr to observe log output.
 */
const captureStdout = () =>
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

const captureStderr = () =>
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

const output = (spy: ReturnType<typeof captureStdout>) =>
  spy.mock.calls.map((call) => String(call[0])).join('');

describe('traceMiddleware', () => {
  beforeEach(() => {
    captureStdout();
    captureStderr();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reuses a valid inbound id and echoes it on the response', () => {
    const req = createRequest({ [httpHeaders.traceId]: 'inbound-trace' });
    const res = createResponse();

    traceMiddleware(req, res, () => undefined);

    expect(res.headers[httpHeaders.traceId]).toBe('inbound-trace');
    expect(req.headers[httpHeaders.traceId]).toBe('inbound-trace');
  });

  it('mints an id when the request carries none', () => {
    const res = createResponse();

    traceMiddleware(createRequest(), res, () => undefined);

    expect(res.headers[httpHeaders.traceId]).toMatch(UUID_PATTERN);
  });

  it('replaces an unsafe inbound id rather than reflecting it', () => {
    const req = createRequest({
      [httpHeaders.traceId]: 'bad\r\nx-injected: 1',
    });
    const res = createResponse();

    traceMiddleware(req, res, () => undefined);

    const traceId = res.headers[httpHeaders.traceId] as string;
    expect(traceId).toMatch(UUID_PATTERN);
    expect(JSON.stringify(res.headers)).not.toContain('injected');
  });

  it('makes the id ambient for downstream handlers', () => {
    const res = createResponse();
    let observed: string | undefined;

    traceMiddleware(createRequest(), res, () => {
      observed = getTraceId();
    });

    expect(observed).toBe(res.headers[httpHeaders.traceId]);
  });

  it('reports the request trace id on the access line', () => {
    const req = createRequest({ [httpHeaders.traceId]: 'access-line-trace' });
    const res = createResponse();
    const stdout = vi.mocked(process.stdout.write);

    traceMiddleware(req, res, () => undefined);
    res.finish();

    expect(output(stdout)).toContain('trace=access-line-trace');
  });

  it('logs method, path, status, duration and trace id on completion', () => {
    const req = {
      method: 'POST',
      path: '/core/report-animal',
      headers: {},
    } as unknown as Request;
    const res = createResponse();
    const stdout = vi.mocked(process.stdout.write);

    traceMiddleware(req, res, () => undefined);
    res.statusCode = 201;
    res.finish();

    expect(output(stdout)).toContain('POST /core/report-animal 201');
    expect(output(stdout)).toContain(
      `trace=${res.headers[httpHeaders.traceId]}`,
    );
  });

  it('escalates the log level for client and server errors', () => {
    const clientRes = createResponse();
    traceMiddleware(
      { method: 'GET', path: '/x', headers: {} } as unknown as Request,
      clientRes,
      () => undefined,
    );
    clientRes.statusCode = 404;
    clientRes.finish();

    const serverRes = createResponse();
    traceMiddleware(
      { method: 'GET', path: '/x', headers: {} } as unknown as Request,
      serverRes,
      () => undefined,
    );
    serverRes.statusCode = 503;
    serverRes.finish();

    // Nest routes `warn` to stdout and `error` to stderr.
    expect(output(vi.mocked(process.stdout.write))).toContain('GET /x 404');
    expect(output(vi.mocked(process.stderr.write))).toContain('GET /x 503');
  });

  it('calls next exactly once', () => {
    const next = vi.fn() as unknown as NextFunction;

    traceMiddleware(createRequest(), createResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
