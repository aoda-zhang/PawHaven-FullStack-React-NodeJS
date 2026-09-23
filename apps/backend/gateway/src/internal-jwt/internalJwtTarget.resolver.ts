import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { InternalJwtTarget } from './InternalJwt.types.js';

@Injectable()
export class InternalJwtTargetResolver {
  private readonly keyId: string;

  private readonly privateKey: string;

  constructor(configService: ConfigService) {
    this.keyId = configService.getOrThrow<string>('internalJwt.keyId');
    this.privateKey = configService.getOrThrow<string>(
      'internalJwt.privateKey',
    );
  }

  resolve(serviceName: string): InternalJwtTarget {
    return {
      audience: serviceName,
      privateKey: this.privateKey,
      keyId: this.keyId,
    };
  }
}
