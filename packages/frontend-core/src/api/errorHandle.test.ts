import { describe, expect, it } from 'vitest';

import { normalizeHttpError } from './errorHandle';
import { httpRequestErrors } from './types';

const axiosError = (
  status: number,
  data: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: { status, data, headers },
});

describe('normalizeHttpError', () => {
  it('maps every 400 response to BADREQUEST, not UNKNOWN', () => {
    expect(
      normalizeHttpError(axiosError(400, { code: 'BAD_REQUEST' })),
    ).toMatchObject({
      type: httpRequestErrors.BADREQUEST,
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('maps 403 to PERMISSION even without a business code', () => {
    expect(normalizeHttpError(axiosError(403))).toMatchObject({
      type: httpRequestErrors.PERMISSION,
      status: 403,
    });
  });

  it('maps 503 to MAINTENANCE', () => {
    expect(normalizeHttpError(axiosError(503))).toMatchObject({
      type: httpRequestErrors.MAINTENANCE,
      status: 503,
    });
  });

  it('maps other 5xx responses to SERVER', () => {
    expect(normalizeHttpError(axiosError(500))).toMatchObject({
      type: httpRequestErrors.SERVER,
      status: 500,
    });
  });

  it('maps 401 to AUTH', () => {
    expect(normalizeHttpError(axiosError(401))).toMatchObject({
      type: httpRequestErrors.AUTH,
      status: 401,
    });
  });

  it('maps a network failure to NETWORK', () => {
    expect(normalizeHttpError(new Error('Network Error'))).toMatchObject({
      type: httpRequestErrors.NETWORK,
    });
  });

  it('reads the trace id from the response header', () => {
    expect(
      normalizeHttpError(
        axiosError(500, {}, { 'x-trace-id': 'trace-from-header' }),
      ),
    ).toMatchObject({ traceId: 'trace-from-header' });
  });

  it('falls back to the body trace id', () => {
    expect(
      normalizeHttpError(axiosError(500, { traceId: 'trace-from-body' })),
    ).toMatchObject({ traceId: 'trace-from-body' });
  });
});
