import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { JwtRefreshMiddleware } from '../middleware/jwt-refresh.middleware';
import { JwtVerificationMiddleware } from '../middleware/jwt-verification.middleware';

import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  imports: [
    HttpModule,
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
  providers: [ProxyService, JwtRefreshMiddleware, JwtVerificationMiddleware],
})
export class ProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply middlewares in order: Refresh first, then Verification
    consumer
      .apply(JwtRefreshMiddleware, JwtVerificationMiddleware)
      .forRoutes({ path: '/:service/*path', method: RequestMethod.ALL });
  }
}
