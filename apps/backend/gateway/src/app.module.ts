import { join } from 'path';

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SharedModule } from '@pawhaven/backend-core';
import { microServiceNames } from '@pawhaven/backend-core/constants';

import { ProxyModule } from './proxy/proxy.module.js';
import { GatewayThrottleGuard } from './throttle/gateway-throttle.guard.js';
import { ThrottleConfigValidator } from './throttle/throttle-config.validator.js';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(import.meta.dirname, '..'),
      serviceName: microServiceNames.GATEWAY,
      configRoot: join(import.meta.dirname, 'config'),
      modules: [],
    }),
    ProxyModule,
  ],
  providers: [
    ThrottleConfigValidator,
    { provide: APP_GUARD, useClass: GatewayThrottleGuard },
  ],
})
export class AppModule {}
