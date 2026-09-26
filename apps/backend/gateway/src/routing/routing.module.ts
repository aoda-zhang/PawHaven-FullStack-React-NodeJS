import { Module } from '@nestjs/common';

import { MicroServiceRegistry } from './microService.registry.js';

@Module({
  providers: [MicroServiceRegistry],
  exports: [MicroServiceRegistry],
})
export class RoutingModule {}
