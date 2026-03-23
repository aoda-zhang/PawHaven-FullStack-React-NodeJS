import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { User, JwtVerifyInfo } from '@pawhaven/shared/types';
import { cookieKeys } from '@pawhaven/backend-core/constants';

import { IS_PUBLIC_API } from '../decorators/public.decorator';
import { IS_OPTIONAL_AUTH } from '../decorators/optional-auth.decorator';

type RequestWithUser = Request & { user?: User };

@Injectable()
export class JwtVerificationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_API, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH,
      [context.getHandler(), context.getClass()],
    );
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const accessToken = req.cookies?.[cookieKeys.access_token];

    if (isPublic || (isOptionalAuth && !accessToken)) {
      return true;
    }

    if (!accessToken) {
      throw new UnauthorizedException('Access token missing');
    }

    const payload = this.verifyAccessToken(accessToken);

    if (!payload?.userId) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
    };

    return true;
  }

  private verifyAccessToken(token: string): JwtVerifyInfo | null {
    try {
      const payload = this.jwtService.verify<JwtVerifyInfo>(token);
      if (!payload?.userId) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}
