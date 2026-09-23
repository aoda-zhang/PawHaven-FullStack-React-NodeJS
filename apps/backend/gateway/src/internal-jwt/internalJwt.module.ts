import { Module } from '@nestjs/common';

import { RoutingModule } from '../routing/routing.module.js';

import { InternalJwtService } from './internalJwt.service.js';
import { InternalJwtTargetResolver } from './internalJwtTarget.resolver.js';

@Module({
  imports: [RoutingModule],
  providers: [InternalJwtService, InternalJwtTargetResolver],
  exports: [InternalJwtService, InternalJwtTargetResolver],
})
export class GatewayInternalJwtModule {}
