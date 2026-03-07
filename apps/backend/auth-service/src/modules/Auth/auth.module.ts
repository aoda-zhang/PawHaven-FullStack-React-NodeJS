import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRefreshMiddleware } from './auth-refresh.middleware';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('auth.jwtSecret');
        const expiresIn = configService.get<number>('auth.jwtExpiresIn');
        if (!secret) {
          throw new Error('JWT config is not correct!');
        }
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  private readonly PUBLIC_ROUTES = ['login', 'register', 'refresh', 'logout'];

  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const prefix = this.configService.get<string>('http.prefix');
    const excludedRoutes = this.PUBLIC_ROUTES.map(
      (route) => `${prefix}/${route}`,
    );

    consumer
      .apply(AuthRefreshMiddleware)
      .exclude(...excludedRoutes)
      .forRoutes('*');
  }
}
