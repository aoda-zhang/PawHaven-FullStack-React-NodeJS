import { join } from 'path';

import { Module, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
  type ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { SharedModule } from '@pawhaven/backend-core';
import { microServiceNames } from '@pawhaven/backend-core/constants';

import { ProxyModule } from './proxy/proxy.module';
import {
  isSensitiveAuthPath,
  type ThrottleConfig,
} from './throttle/gateway-throttle';
import { ThrottleConfigValidator } from './throttle/throttle-config.validator';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(__dirname, '..'),
      serviceName: microServiceNames.GATEWAY,
      modules: [],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => {
        const throttle = configService.getOrThrow<ThrottleConfig>('throttle');
        return {
          throttlers: [
            { name: 'default', ttl: throttle.ttlMs, limit: throttle.limit },
            {
              name: 'auth',
              ttl: throttle.authTtlMs,
              limit: throttle.authLimit,
              skipIf: (context: ExecutionContext) =>
                !isSensitiveAuthPath(context),
            },
          ],
        };
      },
    }),
    ProxyModule,
  ],
  providers: [
    ThrottleConfigValidator,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
