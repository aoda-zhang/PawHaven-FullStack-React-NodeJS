import jwt from 'jsonwebtoken';

import type { InternalJwt } from '../../types/index.js';
import { httpHeaders } from '../../constants/httpHeaders.js';

import { decodePem } from './pem.js';

const SIGNING_ALGORITHM = 'ES256';

export type InternalJwtHeaders = {
  [httpHeaders.gatewayJwt]: string;
};

export const signInternalJwt = (
  claims: InternalJwt,
  privateKey: string,
  keyId: string,
): InternalJwtHeaders => ({
  [httpHeaders.gatewayJwt]: jwt.sign(claims, decodePem(privateKey), {
    algorithm: SIGNING_ALGORITHM,
    keyid: keyId,
  }),
});
