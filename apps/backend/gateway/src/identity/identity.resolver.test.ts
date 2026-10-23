import crypto from 'node:crypto';

import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import { verifyInternalJwt } from '@pawhaven/backend-core/internal-jwt';
import {
  InternalJwtKind,
  type JwtVerifyInfo,
} from '@pawhaven/backend-core/types';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { InternalJwtService } from '../internal-jwt/internalJwt.service.js';
import type {
  InternalJwtIdentity,
  InternalJwtTarget,
} from '../internal-jwt/InternalJwt.types.js';

import { IdentityResolver } from './identity.resolver.js';

const SECRET = 'identity-resolver-test-secret';
const AUDIENCE = 'core-service';
const KEY_ID = 'internal-v1';
const MS_PER_SECOND = 1000;
const FAR_FUTURE_SECONDS = 60 * 60 * 24;
const TRACE_ID = 'trace-1';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const configService = {
  getOrThrow: vi.fn((key: string) => {
    if (key === 'internalJwt.ttlSeconds') return 45;
    if (key === 'auth.jwtClockTolerance') return 30;
    if (key === 'auth.jwtRefreshFallbackSeconds') return 60;
    if (key === 'auth.jwtRefreshWindowPercentage') return 0.2;
    if (key === 'identity.minimumRefreshWindowSeconds') return 1;
    if (key === 'identity.refreshPath') return '/refresh';
    throw new Error(`unexpected config key ${key}`);
  }),
  get: vi.fn((key: string) => (key === 'http.env' ? 'test' : undefined)),
};

const buildResolver = () => {
  const jwtService = new JwtService({ secret: SECRET });
  const target: InternalJwtTarget = {
    audience: AUDIENCE,
    privateKey: privateKey as string,
    keyId: KEY_ID,
  };
  const internalJwtService = new InternalJwtService(configService as never);
  const targetResolver = { resolve: () => target };
  const httpClientService = { create: vi.fn(() => ({ post: vi.fn() })) };

  const resolver = new IdentityResolver(
    jwtService,
    configService as never,
    httpClientService as never,
    internalJwtService,
    targetResolver as never,
  );

  return {
    resolver,
    jwtService,
    internalJwtService,
    target,
    httpClientService,
  };
};

const accessToken = (jwtService: JwtService, claims: Partial<JwtVerifyInfo>) =>
  jwtService.sign({
    userId: 'user-1',
    email: 'reporter@example.com',
    type: 'access',
    sessionExpiresAt:
      Math.floor(Date.now() / MS_PER_SECOND) + FAR_FUTURE_SECONDS,
    ...claims,
  });

const requestWith = (cookies: Record<string, string>) =>
  ({ cookies, headers: {} }) as unknown as Request;

const responseStub = () =>
  ({ append: vi.fn(), headersSent: false }) as unknown as Response;

describe('IdentityResolver username propagation', () => {
  it('carries the username from the access token into the identity', async () => {
    const { resolver, jwtService } = buildResolver();
    const token = accessToken(jwtService, { username: 'reporter-one' });

    const identity = await resolver.resolve(
      requestWith({ access_token: token }),
      responseStub(),
      '/api/core/rescues',
    );

    expect(identity).toMatchObject({
      kind: InternalJwtKind.AUTHENTICATED,
      sub: 'user-1',
      username: 'reporter-one',
    });
  });

  it('puts the username on the internal jwt handed to core-service', async () => {
    const { resolver, jwtService, internalJwtService, target } =
      buildResolver();
    const token = accessToken(jwtService, { username: 'reporter-one' });

    const identity = (await resolver.resolve(
      requestWith({ access_token: token }),
      responseStub(),
      '/api/core/rescues',
    )) as InternalJwtIdentity;

    const headers = internalJwtService.sign(identity, target, TRACE_ID);

    const verified = verifyInternalJwt(headers, {
      audience: AUDIENCE,
      publicKeyByKeyId: { [KEY_ID]: publicKey as string },
      ttlSeconds: 45,
      clockSkewSeconds: 30,
    });

    expect(verified).toMatchObject({
      kind: InternalJwtKind.AUTHENTICATED,
      sub: 'user-1',
      username: 'reporter-one',
    });
  });

  it('leaves the username off the internal jwt for a token without one', async () => {
    const { resolver, jwtService, internalJwtService, target } =
      buildResolver();
    const token = accessToken(jwtService, {});

    const identity = (await resolver.resolve(
      requestWith({ access_token: token }),
      responseStub(),
      '/api/core/rescues',
    )) as InternalJwtIdentity;

    const headers = internalJwtService.sign(identity, target, TRACE_ID);

    const verified = verifyInternalJwt(headers, {
      audience: AUDIENCE,
      publicKeyByKeyId: { [KEY_ID]: publicKey as string },
      ttlSeconds: 45,
      clockSkewSeconds: 30,
    });

    expect(verified).toMatchObject({
      kind: InternalJwtKind.AUTHENTICATED,
      sub: 'user-1',
    });
    expect(verified).not.toHaveProperty('username');
  });

  it(
    'refreshes an expired access token through the routed auth-service endpoint',
    async () => {
      const { resolver, jwtService, httpClientService } = buildResolver();
      const response = responseStub();
      const refreshedAccessToken = accessToken(jwtService, {
        username: 'reporter-two',
      });
      const post = vi.fn().mockResolvedValue({
        headers: {
          'set-cookie': [
            `access_token=${refreshedAccessToken}; Path=/; HttpOnly; SameSite=Lax`,
            'refresh_token=refresh-2; Path=/; HttpOnly; SameSite=Strict',
          ],
        },
      });
      httpClientService.create.mockReturnValue({ post });

      const identity = await resolver.resolve(
        requestWith({
          access_token: 'expired-or-invalid-access-token',
          refresh_token: 'refresh-1',
        }),
        response,
        '/api/core/rescues',
      );

      expect(identity).toMatchObject({
        kind: InternalJwtKind.AUTHENTICATED,
        sub: 'user-1',
        username: 'reporter-two',
      });
      expect(response.append).toHaveBeenCalledWith(
        httpHeaders.setCookie,
        expect.stringContaining(`access_token=${refreshedAccessToken};`),
      );
      expect(response.append).toHaveBeenCalledWith(
        httpHeaders.setCookie,
        expect.stringContaining('refresh_token=refresh-2;'),
      );
      expect(post).toHaveBeenCalledWith(
        '/refresh',
        {},
        expect.objectContaining({
          returnResponse: true,
          headers: expect.objectContaining({
            cookie: 'refresh_token=refresh-1',
          }),
        }),
      );
    },
  );

  it('clears cookies when refresh is rejected as unauthorized', async () => {
    const { resolver, httpClientService } = buildResolver();
    const response = responseStub();
    const post = vi.fn().mockRejectedValue(new UnauthorizedException());
    httpClientService.create.mockReturnValue({ post });

    await expect(
      resolver.resolve(
        requestWith({
          access_token: 'expired-or-invalid-access-token',
          refresh_token: 'expired-refresh-token',
        }),
        response,
        '/api/core/rescues',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(response.append).toHaveBeenCalledTimes(2);
    expect(response.append).toHaveBeenCalledWith(
      httpHeaders.setCookie,
      expect.stringContaining('access_token=;'),
    );
    expect(response.append).toHaveBeenCalledWith(
      httpHeaders.setCookie,
      expect.stringContaining('refresh_token=;'),
    );
  });

  it('uses a still-valid access token when a proactive refresh fails transiently', async () => {
    const { resolver, jwtService, httpClientService } = buildResolver();
    const response = responseStub();
    const token = accessToken(jwtService, {
      exp: Math.floor(Date.now() / MS_PER_SECOND) + 30,
    });
    const post = vi
      .fn()
      .mockRejectedValue(new ServiceUnavailableException('upstream unavailable'));
    httpClientService.create.mockReturnValue({ post });

    const identity = await resolver.resolve(
      requestWith({ access_token: token, refresh_token: 'refresh-1' }),
      response,
      '/api/core/rescues',
    );

    expect(identity).toMatchObject({
      kind: InternalJwtKind.AUTHENTICATED,
      sub: 'user-1',
    });
    expect(response.append).not.toHaveBeenCalled();
  });

  it('preserves session cookies when the auth service refresh request fails transiently', async () => {
    const { resolver, httpClientService } = buildResolver();
    const response = responseStub();
    const post = vi.fn().mockRejectedValue(new Error('upstream unavailable'));
    httpClientService.create.mockReturnValue({ post });

    await expect(
      resolver.resolve(
        requestWith({
          access_token: 'expired-or-invalid-access-token',
          refresh_token: 'refresh-1',
        }),
        response,
        '/api/core/rescues',
      ),
    ).rejects.toThrow('upstream unavailable');

    expect(response.append).not.toHaveBeenCalled();
  });
  it('resolves to anonymous when no session cookies are present', async () => {
    const { resolver } = buildResolver();

    const identity = await resolver.resolve(
      requestWith({}),
      responseStub(),
      '/api/core/rescues',
    );

    expect(identity).toEqual({ kind: InternalJwtKind.ANONYMOUS });
  });
});
