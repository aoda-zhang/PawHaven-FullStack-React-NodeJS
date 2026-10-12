import { describe, expect, it } from 'vitest';

import { httpHeaders } from '../constants/httpHeaders.js';

import {
  generateTraceId,
  getTraceId,
  getTraceIdOr,
  isValidTraceId,
  resolveInboundTraceId,
  runWithTrace,
} from './traceContext.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('isValidTraceId', () => {
  it('accepts a uuid and other safe token values', () => {
    expect(isValidTraceId('trace-abc-123')).toBe(true);
    expect(isValidTraceId('a.b:c_d-e')).toBe(true);
  });

  it('rejects empty and non-string values', () => {
    expect(isValidTraceId('')).toBe(false);
    expect(isValidTraceId(undefined)).toBe(false);
    expect(isValidTraceId(null)).toBe(false);
    expect(isValidTraceId(42)).toBe(false);
  });

  it('rejects values long enough to be used for response padding', () => {
    expect(isValidTraceId('a'.repeat(64))).toBe(true);
    expect(isValidTraceId('a'.repeat(65))).toBe(false);
  });

  it('rejects anything that could smuggle a second response header', () => {
    expect(isValidTraceId('abc\r\nx-injected: 1')).toBe(false);
    expect(isValidTraceId('abc\ndef')).toBe(false);
    expect(isValidTraceId('abc def')).toBe(false);
    expect(isValidTraceId('abc;def')).toBe(false);
  });
});

describe('generateTraceId', () => {
  it('produces a valid, unique id', () => {
    const first = generateTraceId();
    const second = generateTraceId();

    expect(first).toMatch(UUID_PATTERN);
    expect(isValidTraceId(first)).toBe(true);
    expect(first).not.toBe(second);
  });
});

describe('resolveInboundTraceId', () => {
  it('reuses a valid inbound id so the caller controls the trace', () => {
    const traceId = resolveInboundTraceId({
      [httpHeaders.traceId]: 'caller-supplied-id',
    });

    expect(traceId).toBe('caller-supplied-id');
  });

  it('mints an id when the header is absent', () => {
    expect(resolveInboundTraceId({})).toMatch(UUID_PATTERN);
  });

  it('mints an id when the header is present but unsafe', () => {
    const traceId = resolveInboundTraceId({
      [httpHeaders.traceId]: 'bad\r\nx-injected: 1',
    });

    expect(traceId).toMatch(UUID_PATTERN);
    expect(traceId).not.toContain('injected');
  });

  it('uses the first entry when the header arrives as an array', () => {
    expect(
      resolveInboundTraceId({
        [httpHeaders.traceId]: ['first-id', 'second-id'],
      }),
    ).toBe('first-id');
  });

  it('rejects a comma-joined duplicate header rather than adopting part of it', () => {
    expect(resolveInboundTraceId({ [httpHeaders.traceId]: 'a, b' })).toMatch(
      UUID_PATTERN,
    );
  });
});

describe('ambient trace store', () => {
  it('exposes the id to synchronous work inside the scope', () => {
    runWithTrace('sync-trace', () => {
      expect(getTraceId()).toBe('sync-trace');
    });
  });

  it('exposes the id across an await boundary', async () => {
    await runWithTrace('async-trace', async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1);
      });
      expect(getTraceId()).toBe('async-trace');
    });
  });

  it('keeps concurrent requests isolated', async () => {
    const read = async (traceId: string, delay: number) =>
      runWithTrace(traceId, async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
        return getTraceId();
      });

    const [first, second] = await Promise.all([
      read('trace-a', 5),
      read('trace-b', 1),
    ]);

    expect(first).toBe('trace-a');
    expect(second).toBe('trace-b');
  });

  it('reports no id outside any scope', () => {
    expect(getTraceId()).toBeUndefined();
    expect(getTraceIdOr('fallback')).toBe('fallback');
  });

  it('prefers the ambient id over the fallback', () => {
    runWithTrace('ambient-trace', () => {
      expect(getTraceIdOr('fallback')).toBe('ambient-trace');
    });
  });

  it('does not leak the id out of the scope', () => {
    runWithTrace('scoped', () => undefined);
    expect(getTraceId()).toBeUndefined();
  });
});
