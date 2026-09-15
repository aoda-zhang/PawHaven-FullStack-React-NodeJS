import { Module } from '@nestjs/common';

import { MicroServiceRegistry } from './micro-service.registry.js';
import { GatewayConfigValidator } from './gateway-config.validator.js';

@Module({
  providers: [MicroServiceRegistry, GatewayConfigValidator],
  exports: [MicroServiceRegistry],
})
export class RoutingModule {}
