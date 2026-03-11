import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { JwtVerificationGuard } from '../guards/jwt-verification.guard';

import { ProtectedProxyController } from './proxy.controller';
import { PublicProxyController } from './public-proxy.controller';
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
  controllers: [PublicProxyController, ProtectedProxyController],
  providers: [
    ProxyService,
    {
      provide: APP_GUARD,
      useClass: JwtRefreshGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtVerificationGuard,
    },
  ],
})
export class ProxyModule {}
