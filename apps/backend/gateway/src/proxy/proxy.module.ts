import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { GatewayAuthMiddleware } from '../middleware/gateway-auth.middleware';

import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('auth.jwtSecret');
        if (!secret) {
          throw new Error('Gateway JWT secret is not configured');
        }
        return { secret };
      },
    }),
  ],
  controllers: [ProxyController],
  providers: [ProxyService, GatewayAuthMiddleware],
})
export class ProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(GatewayAuthMiddleware).forRoutes('*');
  }
}
