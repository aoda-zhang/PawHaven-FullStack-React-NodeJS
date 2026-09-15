import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { GatewayInternalJwtModule } from '../internal-jwt/internal-jwt.module.js';
import { RoutingModule } from '../routing/routing.module.js';

import { ProxyService } from './proxy.service.js';
import { ProxyController } from './proxy.controller.js';

@Module({
  imports: [RoutingModule, IdentityModule, GatewayInternalJwtModule],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
