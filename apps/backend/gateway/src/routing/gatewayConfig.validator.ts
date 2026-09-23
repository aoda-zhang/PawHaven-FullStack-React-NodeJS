import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type InternalJwtConfig = {
  ttlSeconds?: unknown;
  clockSkewSeconds?: unknown;
};

const INTERNAL_JWT_TTL_MIN_SECONDS = 30;
const INTERNAL_JWT_TTL_MAX_SECONDS = 60;

@Injectable()
export class GatewayConfigValidator {
  constructor(configService: ConfigService) {
    this.validateInternalJwt(configService);
    this.validateSigningInternalJwt(configService);
  }

  private validateInternalJwt(configService: ConfigService): void {
    const internalJwt = configService.get<InternalJwtConfig>('internalJwt');
    const ttlSeconds = internalJwt?.ttlSeconds;
    const clockSkewSeconds = internalJwt?.clockSkewSeconds;

    if (
      typeof ttlSeconds !== 'number' ||
      ttlSeconds < INTERNAL_JWT_TTL_MIN_SECONDS ||
      ttlSeconds > INTERNAL_JWT_TTL_MAX_SECONDS
    ) {
      throw new Error(
        `internalJwt.ttlSeconds must be a number between ${INTERNAL_JWT_TTL_MIN_SECONDS} and ${INTERNAL_JWT_TTL_MAX_SECONDS}`,
      );
    }
    if (typeof clockSkewSeconds !== 'number' || clockSkewSeconds < 0) {
      throw new Error(
        'internalJwt.clockSkewSeconds must be a non-negative number',
      );
    }
  }

  private validateSigningInternalJwt(configService: ConfigService): void {
    const internalJwt = configService.get<{
      keyId?: unknown;
      privateKey?: unknown;
    }>('internalJwt');
    if (!internalJwt?.keyId || !internalJwt?.privateKey) {
      throw new Error('internalJwt keyId and privateKey must be configured');
    }
  }
}
