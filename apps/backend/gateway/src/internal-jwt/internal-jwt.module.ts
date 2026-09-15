import { Module } from '@nestjs/common';

import { RoutingModule } from '../routing/routing.module.js';

import { InternalJwtService } from './internal-jwt.service.js';
import { InternalJwtTargetResolver } from './internal-jwt-target.resolver.js';

@Module({
  imports: [RoutingModule],
  providers: [InternalJwtService, InternalJwtTargetResolver],
  exports: [InternalJwtService, InternalJwtTargetResolver],
})
export class GatewayInternalJwtModule {}
