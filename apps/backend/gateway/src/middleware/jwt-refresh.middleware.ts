import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtVerifyInfo } from '@pawhaven/shared/types';
import { AUTH_PUBLIC_PATHS, cookieKeys } from '@pawhaven/shared/constants';
import { isProd } from '@pawhaven/shared/utils';
import { firstValueFrom } from 'rxjs';

/**
 * JWT Refresh Middleware
 * - Proactively refreshes access tokens before they expire
 * - Checks if token is in refresh window (20% of lifetime remaining)
 * - Calls auth-service /refresh endpoint to get new tokens
 */
@Injectable()
export class JwtRefreshMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtRefreshMiddleware.name);

  private readonly publicPaths = new Set(AUTH_PUBLIC_PATHS);

  constructor(
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const path = this.normalizePath(req.path);

    // Skip refresh for public paths
    if (this.publicPaths.has(path)) {
      return next();
    }

    const accessToken = req.cookies?.[cookieKeys.access_token];

    if (!accessToken) {
      // No access token, try to refresh
      await this.attemptTokenRefresh(req, res, { clearCookiesOnFailure: true });
      return next();
    }

    const accessPayload = await this.verifyAccessToken(accessToken);

    if (accessPayload) {
      // Token is valid, check if it needs refresh soon
      const shouldRefresh = this.shouldRefreshSoon(accessPayload);

      if (!shouldRefresh) {
        // Token is valid and not expiring soon, no refresh needed
        return next();
      }
    }

    // Token is invalid or expiring soon, attempt refresh
    await this.attemptTokenRefresh(req, res, {
      clearCookiesOnFailure: !accessPayload,
    });

    return next();
  }

  private async verifyAccessToken(
    token: string,
  ): Promise<JwtVerifyInfo | null> {
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

  private shouldRefreshSoon(payload: JwtVerifyInfo): boolean {
    if (!payload.exp) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const remainingSeconds = payload.exp - nowInSeconds;
    const refreshWindowSeconds = this.getRefreshWindowSeconds(payload);

    return remainingSeconds <= refreshWindowSeconds;
  }

  private getRefreshWindowSeconds(payload: JwtVerifyInfo): number {
    const fallbackSeconds = Math.floor(
      this.configService.get<number>('auth.jwtRefreshFallbackSeconds') ??
        5 * 60,
    );
    const windowPercentage =
      this.configService.get<number>('auth.jwtRefreshWindowPercentage') ?? 0.2;
    if (!payload.iat || !payload.exp) {
      return fallbackSeconds;
    }

    const tokenLifetimeSeconds = payload.exp - payload.iat;
    if (tokenLifetimeSeconds <= 0) {
      return fallbackSeconds;
    }

    return Math.max(1, Math.floor(tokenLifetimeSeconds * windowPercentage));
  }

  private async attemptTokenRefresh(
    req: Request,
    res: Response,
    options: { clearCookiesOnFailure: boolean },
  ): Promise<void> {
    const refreshToken = req.cookies?.[cookieKeys.refresh_token];

    if (!refreshToken) {
      this.logger.warn('refresh token missing');
      if (options.clearCookiesOnFailure) {
        this.clearAuthCookies(res);
      }
      return;
    }

    try {
      // Get auth-service configuration
      const microServices =
        this.configService.get<any[]>('microServices') || [];
      const authService = microServices.find((s) => s.name === 'auth-service');

      if (!authService?.options) {
        this.logger.error('Auth service configuration not found');
        return;
      }

      const authServiceUrl = `http://${authService.options.host}:${authService.options.port}`;

      // Call auth-service /refresh endpoint
      const response = await firstValueFrom(
        this.httpService.post(
          `${authServiceUrl}/api/auth/refresh`,
          {},
          {
            headers: {
              Cookie: `${cookieKeys.refresh_token}=${refreshToken}`,
            },
          },
        ),
      );

      if (response.data && response.headers['set-cookie']) {
        // Parse and set new cookies
        const setCookieHeaders = response.headers['set-cookie'];
        this.updateAuthCookies(req, res, setCookieHeaders);
      }
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      if (options.clearCookiesOnFailure) {
        this.clearAuthCookies(res);
      }
    }
  }

  private updateAuthCookies(
    req: Request,
    res: Response,
    setCookieHeaders: string[],
  ): void {
    // Forward set-cookie headers to response
    setCookieHeaders.forEach((cookie) => {
      res.setHeader('Set-Cookie', cookie);

      // Also update request cookies for current request
      const match = cookie.match(/^([^=]+)=([^;]+)/);
      if (match) {
        const [, name, value] = match;
        // eslint-disable-next-line no-param-reassign
        req.cookies = req.cookies || {};
        // eslint-disable-next-line no-param-reassign
        req.cookies[name] = value;
      }
    });
  }

  private clearAuthCookies(res: Response): void {
    const cookieOptions = 'Path=/; Max-Age=0; HttpOnly; SameSite=Strict';
    const env = this.configService.get<string>('http.env');
    const secureSuffix = isProd(env) ? '; Secure' : '';

    res.setHeader('Set-Cookie', [
      `${cookieKeys.access_token}=; ${cookieOptions}${secureSuffix}`,
      `${cookieKeys.refresh_token}=; ${cookieOptions}${secureSuffix}`,
    ]);
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
