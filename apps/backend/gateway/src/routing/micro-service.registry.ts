import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { MicroServiceConfig } from './micro-service.config.js';

const MICRO_SERVICES_KEY = 'microServices';

@Injectable()
export class MicroServiceRegistry {
  private readonly microServices: MicroServiceConfig[];

  constructor(configService: ConfigService) {
    this.microServices =
      configService.get<MicroServiceConfig[]>(MICRO_SERVICES_KEY) ?? [];
  }

  findByName(name: string): MicroServiceConfig | undefined {
    return this.microServices.find(
      (microService) => microService.name === name && microService.enable,
    );
  }

  findByGatewayPrefix(prefix: string): MicroServiceConfig | undefined {
    return this.microServices.find(
      (microService) =>
        microService.options?.gatewayPrefix === prefix && microService.enable,
    );
  }
}
