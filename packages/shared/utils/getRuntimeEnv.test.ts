import { describe, expect, it } from 'vitest';

import { getRuntimeEnv } from './getRuntimeEnv.js';

describe('getRuntimeEnv', () => {
  it.each(['dev', 'uat', 'test', 'prod'])('returns %s unchanged', (env) => {
    expect(getRuntimeEnv(env)).toBe(env);
  });

  it.each([undefined, '', 'development', 'production', 'staging', 'toString'])(
    'throws for %p',
    (env) => {
      expect(() => getRuntimeEnv(env)).toThrow(
        `Invalid APP_ENV "${env ?? '<unset>'}"`,
      );
    },
  );

  it('lists the accepted values in the error message', () => {
    expect(() => getRuntimeEnv(undefined)).toThrow(
      'expected one of dev, uat, test, prod',
    );
  });
});
