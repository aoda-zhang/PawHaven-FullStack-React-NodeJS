import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

type AuthUser = {
  userId: string;
  email?: string;
};

/**
 * Gateway Authentication Middleware
 * - Verifies JWT tokens for all non-public routes
 * - Attaches user info to request for downstream services
 */
@Injectable()
export class GatewayAuthMiddleware implements NestMiddleware {
  private readonly publicPaths = new Set([
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
  ]);

  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, _: Response, next: NextFunction): void {
    const path = this.normalizePath(req.path);

    // Skip authentication for public paths
    if (this.publicPaths.has(path)) {
      return next();
    }

    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Access token missing');
    }

    try {
      const payload = this.jwtService.verify<AuthUser>(token);

      if (!payload?.userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Attach user info to request for proxy service
      const mutableReq = req as Request & { user?: AuthUser };
      mutableReq.user = {
        userId: payload.userId,
        email: payload.email,
      };
      return next();
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(req: Request): string | undefined {
    // 1. Try cookies (primary method for browser clients)
    const cookieToken =
      req.cookies?.['__Host-access-token'] || req.cookies?.access_token;
    if (cookieToken) return cookieToken;

    // 2. Try Authorization header (for API clients)
    const authHeader = req.headers.authorization;
    if (!authHeader) return undefined;

    const [scheme, token] = authHeader.split(' ');
    return scheme === 'Bearer' && token ? token : undefined;
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
