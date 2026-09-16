import crypto from 'node:crypto';

import { JwtService } from '@nestjs/jwt';
import { verifyInternalJwt } from '@pawhaven/backend-core/internal-jwt';
import {
  InternalJwtKind,
  type JwtVerifyInfo,
} from '@pawhaven/backend-core/types';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { InternalJwtService } from '../internal-jwt/internal-jwt.service.js';
import type {
  InternalJwtIdentity,
  InternalJwtTarget,
} from '../internal-jwt/internal-jwt.types.js';

import { IdentityResolver } from './identity.resolver.js';

const SECRET = 'identity-resolver-test-secret';
const AUDIENCE = 'core-service';
const KEY_ID = 'core-v1';
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
  const httpClientService = { create: vi.fn() };

  const resolver = new IdentityResolver(
    jwtService,
    configService as never,
    httpClientService as never,
    internalJwtService,
    targetResolver as never,
  );

  return { resolver, jwtService, internalJwtService, target };
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
