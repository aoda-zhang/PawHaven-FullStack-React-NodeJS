import type { IncomingHttpHeaders } from 'http';

import jwt, { type Jwt, type JwtPayload } from 'jsonwebtoken';

import { InternalJwtSchema, type InternalJwt } from '../../types/index.js';
import { httpHeaders } from '../../constants/httpHeaders.js';
import { readHeader } from '../../utils/readHeader.js';

import {
  InternalJwtVerificationError,
  InternalJwtVerificationErrorCode as Code,
} from './errors.js';
import { decodePem } from './pem.js';

const MILLISECONDS_PER_SECOND = 1000;
const SIGNING_ALGORITHM = 'ES256';

export interface VerifyInternalJwtOptions {
  audience: string;
  publicKeyByKeyId: Record<string, string>;
  ttlSeconds: number;
  clockSkewSeconds: number;
}

const nowSeconds = (): number =>
  Math.floor(Date.now() / MILLISECONDS_PER_SECOND);

const decodeJwt = (token: string): Jwt | null => {
  try {
    return jwt.decode(token, { complete: true });
  } catch {
    return null;
  }
};

const parseClaims = (payload: string | JwtPayload): InternalJwt | null => {
  try {
    return InternalJwtSchema.parse(payload);
  } catch {
    return null;
  }
};

export const verifyInternalJwt = (
  headers: IncomingHttpHeaders,
  options: VerifyInternalJwtOptions,
): InternalJwt => {
  const { audience, publicKeyByKeyId, ttlSeconds, clockSkewSeconds } = options;

  const token = readHeader(headers, httpHeaders.gatewayJwt);
  if (token === undefined) {
    throw new InternalJwtVerificationError(Code.MISSING_HEADER);
  }

  const decoded = decodeJwt(token);
  if (!decoded) {
    throw new InternalJwtVerificationError(Code.INVALID_ENCODING);
  }

  const keyId = decoded.header?.kid;
  if (!keyId || !publicKeyByKeyId[keyId]) {
    throw new InternalJwtVerificationError(Code.UNKNOWN_KEY);
  }

  let verified: Jwt;
  try {
    verified = jwt.verify(token, decodePem(publicKeyByKeyId[keyId]), {
      algorithms: [SIGNING_ALGORITHM],
      clockTolerance: clockSkewSeconds,
      complete: true,
    }) as Jwt;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new InternalJwtVerificationError(Code.EXPIRED);
    }
    throw new InternalJwtVerificationError(Code.BAD_SIGNATURE);
  }

  const claims = parseClaims(verified.payload);
  if (!claims) {
    throw new InternalJwtVerificationError(Code.INVALID_PAYLOAD);
  }

  if (claims.aud !== audience) {
    throw new InternalJwtVerificationError(Code.AUDIENCE_MISMATCH);
  }
  if (claims.exp - claims.iat > ttlSeconds) {
    throw new InternalJwtVerificationError(Code.LIFETIME_EXCEEDED);
  }
  if (claims.iat > nowSeconds() + clockSkewSeconds) {
    throw new InternalJwtVerificationError(Code.NOT_YET_ISSUED);
  }

  return claims;
};
