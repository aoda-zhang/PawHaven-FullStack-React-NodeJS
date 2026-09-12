import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  signInternalJwt,
  type InternalJwtHeaders,
} from '@pawhaven/backend-core/internal-jwt';
import { InternalJwtKind, type InternalJwt } from '@pawhaven/shared/types';

import type {
  InternalJwtIdentity,
  InternalJwtTarget,
} from './internal-jwt.types';

const MS_PER_SECOND = 1000;

@Injectable()
export class InternalJwtService {
  private readonly ttlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.ttlSeconds = this.configService.getOrThrow<number>(
      'internalJwt.ttlSeconds',
    );
  }

  sign(
    identity: InternalJwtIdentity,
    target: InternalJwtTarget,
    rid: string,
  ): InternalJwtHeaders {
    return signInternalJwt(
      this.buildInternalJwt(identity, target, rid),
      target.privateKey,
      target.keyId,
    );
  }

  private buildInternalJwt(
    identity: InternalJwtIdentity,
    target: InternalJwtTarget,
    rid: string,
  ): InternalJwt {
    const nowInSeconds = Math.floor(Date.now() / MS_PER_SECOND);
    const base = {
      aud: target.audience,
      iat: nowInSeconds,
      exp: nowInSeconds + this.ttlSeconds,
      rid,
    };

    if (identity.kind === InternalJwtKind.ANONYMOUS) {
      return { kind: InternalJwtKind.ANONYMOUS, ...base };
    }

    const claims: InternalJwt = {
      kind: InternalJwtKind.AUTHENTICATED,
      ...base,
      sub: identity.sub,
    };
    if (identity.email !== undefined) {
      claims.email = identity.email;
    }
    if (identity.roles !== undefined) {
      claims.roles = identity.roles;
    }
    return claims;
  }
}
