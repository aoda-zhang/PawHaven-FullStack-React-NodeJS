import { sign } from 'jsonwebtoken';
import type { InternalJwt } from '@pawhaven/shared/types';

import { httpHeaders } from '../../constants/httpHeaders';

import { decodePem } from './pem';

const SIGNING_ALGORITHM = 'ES256';

export type InternalJwtHeaders = {
  [httpHeaders.gatewayJwt]: string;
};

export const signInternalJwt = (
  claims: InternalJwt,
  privateKey: string,
  keyId: string,
): InternalJwtHeaders => ({
  [httpHeaders.gatewayJwt]: sign(claims, decodePem(privateKey), {
    algorithm: SIGNING_ALGORITHM,
    keyid: keyId,
  }),
});
