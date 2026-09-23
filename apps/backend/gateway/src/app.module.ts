import { join } from 'path';

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  collectServiceConfigSources,
  SharedModule,
} from '@pawhaven/backend-core';
import { microServiceNames } from '@pawhaven/backend-core/constants';
import { MiddlewareModule } from '@pawhaven/backend-core/middlewares';

import { ProxyModule } from './proxy/proxy.module.js';
import { GatewayThrottleGuard } from './throttle/gatewayThrottle.guard.js';
import { ThrottleConfigValidator } from './throttle/throttleConfig.validator.js';

const configContext = import.meta.webpackContext('./config', {
  recursive: true,
  regExp: /\/env\/index\.json$/,
});

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(import.meta.dirname, '..'),
      serviceName: microServiceNames.GATEWAY,
      configSources: collectServiceConfigSources(configContext),
      modules: [],
    }),
    MiddlewareModule,
    ProxyModule,
  ],
  providers: [
    ThrottleConfigValidator,
    { provide: APP_GUARD, useClass: GatewayThrottleGuard },
  ],
})
export class AppModule {}
