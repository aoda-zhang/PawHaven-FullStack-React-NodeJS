import { describe, expect, it } from 'vitest';

import { httpRequestErrors } from '../api/types';

import { getRequestQueryOptions } from './reactQuery';

const getRetry = (maxRetry = 2) =>
  getRequestQueryOptions({ maxRetry }).defaultOptions.queries.retry;

describe('getRequestQueryOptions retry policy', () => {
  it('does not retry client errors', () => {
    const retry = getRetry();

    expect(retry(0, { type: httpRequestErrors.BADREQUEST })).toBe(false);
    expect(retry(0, { type: httpRequestErrors.PERMISSION })).toBe(false);
    expect(retry(0, { type: httpRequestErrors.AUTH })).toBe(false);
    expect(retry(0, { type: httpRequestErrors.RATELIMIT })).toBe(false);
    expect(retry(0, { type: httpRequestErrors.UNKNOWN })).toBe(false);
  });

  it('retries transient server and network failures', () => {
    const retry = getRetry();

    expect(retry(0, { type: httpRequestErrors.SERVER })).toBe(true);
    expect(retry(0, { type: httpRequestErrors.MAINTENANCE })).toBe(true);
    expect(retry(0, { type: httpRequestErrors.NETWORK })).toBe(true);
  });

  it('stops after maxRetry attempts', () => {
    const retry = getRetry(2);

    expect(retry(1, { type: httpRequestErrors.SERVER })).toBe(true);
    expect(retry(2, { type: httpRequestErrors.SERVER })).toBe(false);
  });
});
