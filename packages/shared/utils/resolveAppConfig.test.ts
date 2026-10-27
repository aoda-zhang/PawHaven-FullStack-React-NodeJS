import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveAppConfig } from './resolveAppConfig.js';

describe('resolveAppConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns once per missing variable across repeated calls', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    resolveAppConfig(
      { first: '${REPORT_ONCE_FIRST}', second: '${REPORT_ONCE_SECOND}' },
      {},
    );
    expect(warn.mock.calls.map(([message]) => message)).toEqual([
      'Missing environment variable for placeholder: REPORT_ONCE_FIRST',
      'Missing environment variable for placeholder: REPORT_ONCE_SECOND',
    ]);

    resolveAppConfig(
      { first: '${REPORT_ONCE_FIRST}', second: '${REPORT_ONCE_SECOND}' },
      {},
    );
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('warns once when the same placeholder repeats inside one object', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    resolveAppConfig(
      { first: '${REPORT_REPEAT_ONCE}', second: '${REPORT_REPEAT_ONCE}' },
      {},
    );

    expect(warn.mock.calls.map(([message]) => message)).toEqual([
      'Missing environment variable for placeholder: REPORT_REPEAT_ONCE',
    ]);
  });

  it('interpolates present variables and empties missing ones', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const resolved = resolveAppConfig(
      {
        host: '${TEST_HOST}',
        port: '${TEST_MISSING_PORT}',
        nested: { url: 'https://${TEST_HOST}/api' },
        list: ['${TEST_HOST}', '${TEST_MISSING_ITEM}'],
        count: 3,
      },
      { TEST_HOST: 'api.example.com' },
    );

    expect(resolved).toEqual({
      host: 'api.example.com',
      port: '',
      nested: { url: 'https://api.example.com/api' },
      list: ['api.example.com', ''],
      count: 3,
    });
    expect(warn.mock.calls.map(([message]) => message)).toEqual([
      'Missing environment variable for placeholder: TEST_MISSING_PORT',
      'Missing environment variable for placeholder: TEST_MISSING_ITEM',
    ]);
  });
});
