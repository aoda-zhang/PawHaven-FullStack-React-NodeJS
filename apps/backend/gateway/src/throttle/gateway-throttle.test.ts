import type { ExecutionContext } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { isSensitiveAuthPath, type ThrottleConfig } from './gatewayThrottle.js';
import { GatewayThrottleGuard } from './gatewayThrottle.guard.js';

const contextFor = (request: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

const config: ThrottleConfig = {
  ttlMs: 60_000,
  limit: 5,
  authTtlMs: 60_000,
  authLimit: 2,
};

const buildGuard = (overrides: Partial<ThrottleConfig> = {}) =>
  new GatewayThrottleGuard({
    getOrThrow: () => ({ ...config, ...overrides }),
  } as unknown as ConfigService);

const hit = (
  guard: GatewayThrottleGuard,
  path = '/api/core/rescues',
  ip = '10.0.0.1',
) => guard.canActivate(contextFor({ path, ip }));

describe('isSensitiveAuthPath', () => {
  it.each([
    ['/api/auth/login', true],
    ['/api/auth/register', true],
    ['/api/auth/refresh', true],
    ['/api/auth/logout', false],
    ['/api/auth/me', false],
    ['/api/core/rescues', false],
  ])('%s is treated as sensitive: %s', (path, expected) => {
    expect(isSensitiveAuthPath(contextFor({ path }))).toBe(expected);
  });

  it('treats a request without a path as non-sensitive', () => {
    expect(isSensitiveAuthPath(contextFor({}))).toBe(false);
  });
});

describe('GatewayThrottleGuard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests up to the configured limit', () => {
    const guard = buildGuard();

    for (let i = 0; i < config.limit; i += 1) {
      expect(hit(guard)).toBe(true);
    }
  });

  it('rejects once the default limit is exceeded', () => {
    const guard = buildGuard();
    for (let i = 0; i < config.limit; i += 1) {
      hit(guard);
    }

    expect(() => hit(guard)).toThrow(HttpException);
    try {
      hit(guard);
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(429);
    }
  });

  it('tracks separate windows for separate clients', () => {
    const guard = buildGuard();
    for (let i = 0; i < config.limit; i += 1) {
      hit(guard, '/api/core/rescues', '10.0.0.1');
    }

    expect(() => hit(guard, '/api/core/rescues', '10.0.0.1')).toThrow(
      HttpException,
    );
    expect(hit(guard, '/api/core/rescues', '10.0.0.2')).toBe(true);
  });

  it('applies the stricter auth limiter only on credential paths', () => {
    const guard = buildGuard();

    hit(guard, '/api/auth/login');
    hit(guard, '/api/auth/login');
    expect(() => hit(guard, '/api/auth/login')).toThrow(HttpException);

    const other = buildGuard();
    for (let i = 0; i < config.authLimit + 1; i += 1) {
      expect(hit(other, '/api/core/rescues')).toBe(true);
    }
  });

  it('closes the window once the ttl elapses', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const guard = buildGuard({ ttlMs: 1000, limit: 1 });

    expect(hit(guard)).toBe(true);
    expect(() => hit(guard)).toThrow(HttpException);

    vi.setSystemTime(1001);
    expect(hit(guard)).toBe(true);
  });
});
