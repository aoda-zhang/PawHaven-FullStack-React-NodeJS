import { Injectable } from '@nestjs/common';

import { MicroServiceRegistry } from '../routing/micro-service.registry';

import type { InternalJwtTarget } from './internal-jwt.types';

@Injectable()
export class InternalJwtTargetResolver {
  constructor(private readonly microServiceRegistry: MicroServiceRegistry) {}

  resolve(serviceName: string): InternalJwtTarget {
    const microService = this.microServiceRegistry.findByName(serviceName);
    return {
      audience: serviceName,
      privateKey: microService?.options?.internalJwt?.privateKey ?? '',
      keyId: microService?.options?.internalJwt?.keyId ?? '',
    };
  }
}
