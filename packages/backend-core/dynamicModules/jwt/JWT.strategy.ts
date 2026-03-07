import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('auth.jwtSecret');

    if (!secret) {
      throw new Error('JWT secret is not configured!');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from cookie (primary method)
        (request: Request) => {
          return (
            request?.cookies?.['__Host-access-token'] ||
            request?.cookies?.access_token
          );
        },
        // Fallback to header for backwards compatibility
        ExtractJwt.fromHeader('access-token'),
      ]),
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.userId,
      email: payload.email,
    };
  }
}
