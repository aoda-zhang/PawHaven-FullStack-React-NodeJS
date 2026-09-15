import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { isSensitiveAuthPath } from './gateway-throttle';

const contextFor = (request: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('isSensitiveAuthPath', () => {
  it.each([
    ['/api/auth/login', true],
    ['/api/auth/register', true],
    ['/api/auth/refresh', true],
    ['/api/auth/logout', false],
    ['/api/auth/me', false],
    ['/api/core/rescues', false],
    ['/api/document/pdf', false],
  ])('%s is treated as sensitive: %s', (path, expected) => {
    expect(isSensitiveAuthPath(contextFor({ path }))).toBe(expected);
  });

  it('treats a request without a path as non-sensitive', () => {
    expect(isSensitiveAuthPath(contextFor({}))).toBe(false);
  });
});
