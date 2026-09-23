import { Module } from '@nestjs/common';

import { MicroServiceRegistry } from './microService.registry.js';
import { GatewayConfigValidator } from './gatewayConfig.validator.js';

@Module({
  providers: [MicroServiceRegistry, GatewayConfigValidator],
  exports: [MicroServiceRegistry],
})
export class RoutingModule {}
