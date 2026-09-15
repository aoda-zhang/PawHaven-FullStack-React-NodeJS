import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { MicroServiceConfig } from './micro-service.config';

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
    this.validateMicroServiceInternalJwts(configService);
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

  private validateMicroServiceInternalJwts(configService: ConfigService): void {
    const microServices =
      configService.get<MicroServiceConfig[]>('microServices') ?? [];
    microServices.forEach((microService) => {
      if (!microService.enable) {
        return;
      }
      const internalJwt = microService.options?.internalJwt;
      const name = String(microService.name ?? 'unknown');
      if (!internalJwt?.keyId || !internalJwt?.privateKey) {
        throw new Error(
          `microService ${name}: internalJwt keyId and privateKey must be configured`,
        );
      }
    });
  }
}
