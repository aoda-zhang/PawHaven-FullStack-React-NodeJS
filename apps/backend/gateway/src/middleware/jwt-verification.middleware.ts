import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { User } from '@pawhaven/shared/types';
import { AUTH_PUBLIC_PATHS, cookieKeys } from '@pawhaven/shared/constants';

/**
 * JWT Verification Middleware
 * - Verifies JWT tokens for all non-public routes
 * - Attaches user info to request for downstream services
 * - Token refresh is handled by JwtRefreshMiddleware (runs before this)
 */
@Injectable()
export class JwtVerificationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtVerificationMiddleware.name);

  private readonly publicPaths = new Set(AUTH_PUBLIC_PATHS);

  constructor(private readonly jwtService: JwtService) {}

  use(req: Request & { user?: User }, _: Response, next: NextFunction): void {
    const path = this.normalizePath(req.path);

    // Skip authentication for public paths
    if (this.publicPaths.has(path)) {
      return next();
    }

    const accessToken = req.cookies?.[cookieKeys.access_token];
    if (!accessToken) {
      this.logger.warn(`verify missing access token path=${path}`);
      throw new UnauthorizedException('Access token missing');
    }

    try {
      const verificationInfo = this.jwtService.verify<User>(accessToken);

      if (!verificationInfo?.userId) {
        throw new UnauthorizedException('Invalid token verificationInfo');
      }

      // Attach user info to request for proxy service
      // eslint-disable-next-line no-param-reassign
      req.user = {
        userId: verificationInfo.userId,
        email: verificationInfo.email,
      };
      return next();
    } catch {
      this.logger.warn(`verify failed path=${path}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private normalizePath(path: string): string {
    // Remove API version prefix (e.g., /api/v1/auth/login -> /api/auth/login)
    const withoutVersion = path.replace(/^\/api\/v\d+\//, '/api/');
    // Remove trailing slash
    return withoutVersion.endsWith('/') && withoutVersion.length > 1
      ? withoutVersion.slice(0, -1)
      : withoutVersion;
  }
}
