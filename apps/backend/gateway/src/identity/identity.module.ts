import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { GatewayInternalJwtModule } from '../internal-jwt/internal-jwt.module.js';

import { IdentityResolver } from './identity.resolver.js';

@Module({
  imports: [
    GatewayInternalJwtModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('auth.jwtSecret');
        if (!secret) {
          throw new Error('Gateway JWT secret is not configured');
        }
        return {
          secret,
          verifyOptions: {
            clockTolerance: configService.getOrThrow<number>(
              'auth.jwtClockTolerance',
            ),
          },
        };
      },
    }),
  ],
  providers: [IdentityResolver],
  exports: [IdentityResolver],
})
export class IdentityModule {}
