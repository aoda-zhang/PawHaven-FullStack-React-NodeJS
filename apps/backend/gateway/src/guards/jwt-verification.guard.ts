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

const MS_PER_SECOND = 1000;
const LOGOUT_PATH_SUFFIX = '/auth/logout';

@Injectable()
export class JwtVerificationGuard implements CanActivate {
  private readonly denylist = new Map<string, number>();

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

    if (isPublic) {
      return true;
    }

    if (!accessToken) {
      if (isOptionalAuth) {
        return true;
      }
      throw new UnauthorizedException('Access token missing');
    }

    const payload = this.verifyAccessToken(accessToken);

    if (!payload?.userId) {
      if (isOptionalAuth) {
        return true;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.jti && this.isDenied(payload.jti)) {
      if (isOptionalAuth) {
        return true;
      }
      throw new UnauthorizedException('Session revoked, please login again');
    }

    if (payload.jti && payload.exp && this.isLogoutPath(req.path)) {
      this.deny(payload.jti, payload.exp);
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
      if (!payload?.userId || payload.type !== 'access') {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  private isLogoutPath(path: string): boolean {
    return path.endsWith(LOGOUT_PATH_SUFFIX);
  }

  private isDenied(jti: string): boolean {
    const nowInSeconds = Math.floor(Date.now() / MS_PER_SECOND);
    const expiry = this.denylist.get(jti);
    if (expiry === undefined) {
      return false;
    }
    if (expiry <= nowInSeconds) {
      this.denylist.delete(jti);
      return false;
    }
    return true;
  }

  private deny(jti: string, exp: number): void {
    this.denylist.set(jti, exp);
  }
}
