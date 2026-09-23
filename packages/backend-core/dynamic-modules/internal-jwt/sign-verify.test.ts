import crypto from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { InternalJwtKind, type InternalJwt } from '../../types/index.js';

import { signInternalJwt } from './sign.js';
import { verifyInternalJwt } from './verify.js';

const MS_PER_SECOND = 1000;
const TTL_SECONDS = 60;
const CLOCK_SKEW_SECONDS = 5;
const AUDIENCE = 'core-service';
const KEY_ID = 'test-key-1';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const options = {
  audience: AUDIENCE,
  publicKeyByKeyId: { [KEY_ID]: publicKey as string },
  ttlSeconds: TTL_SECONDS,
  clockSkewSeconds: CLOCK_SKEW_SECONDS,
};

const headersFor = (claims: InternalJwt) =>
  signInternalJwt(claims, privateKey as string, KEY_ID);

const roundTrip = (claims: InternalJwt) =>
  verifyInternalJwt(headersFor(claims), options);

const claimBase = () => {
  const nowInSeconds = Math.floor(Date.now() / MS_PER_SECOND);
  return {
    aud: AUDIENCE,
    iat: nowInSeconds,
    exp: nowInSeconds + TTL_SECONDS,
    rid: 'rid-1',
  };
};

describe('internal jwt sign/verify round trip', () => {
  it('carries the reporter username across the gateway to core boundary', () => {
    const claims: InternalJwt = {
      kind: InternalJwtKind.AUTHENTICATED,
      ...claimBase(),
      sub: 'user-1',
      email: 'reporter@example.com',
      username: 'reporter-one',
    };

    expect(roundTrip(claims)).toMatchObject({
      kind: InternalJwtKind.AUTHENTICATED,
      sub: 'user-1',
      username: 'reporter-one',
    });
  });

  it('keeps email and roles alongside the username', () => {
    const claims: InternalJwt = {
      kind: InternalJwtKind.AUTHENTICATED,
      ...claimBase(),
      sub: 'user-1',
      email: 'reporter@example.com',
      roles: ['admin'],
      username: 'reporter-one',
    };

    expect(roundTrip(claims)).toMatchObject({
      email: 'reporter@example.com',
      roles: ['admin'],
      username: 'reporter-one',
    });
  });
});
