import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import type { JwtVerifyInfo } from '@pawhaven/shared/types';

import { AuthService } from './auth.service';

@Injectable()
export class AuthRefreshMiddleware implements NestMiddleware {
  private readonly fallbackRefreshWindowSeconds = 5 * 60;

  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const accessToken = this.authService.getTokenFromRequest(req, 'access');

    if (!accessToken) {
      await this.attemptTokenRefresh(req, res, {
        clearCookiesOnFailure: true,
      });
      return next();
    }

    const accessPayload = await this.verifyAccessToken(accessToken);

    if (accessPayload) {
      const shouldRefresh = this.shouldRefreshSoon(accessPayload);

      if (!shouldRefresh) {
        return next();
      }
    }

    await this.attemptTokenRefresh(req, res, {
      clearCookiesOnFailure: !accessPayload,
    });
    return next();
  }

  private async verifyAccessToken(
    token: string,
  ): Promise<JwtVerifyInfo | null> {
    try {
      return await this.authService.verifyToken(token);
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
    if (!payload.iat || !payload.exp) {
      return this.fallbackRefreshWindowSeconds;
    }

    const tokenLifetimeSeconds = payload.exp - payload.iat;
    if (tokenLifetimeSeconds <= 0) {
      return this.fallbackRefreshWindowSeconds;
    }

    return Math.max(1, Math.floor(tokenLifetimeSeconds * 0.2));
  }

  private async attemptTokenRefresh(
    req: Request,
    res: Response,
    options: {
      clearCookiesOnFailure: boolean;
    },
  ): Promise<void> {
    const refreshToken = this.authService.getTokenFromRequest(req, 'refresh');

    if (!refreshToken) {
      if (options.clearCookiesOnFailure) {
        this.authService.clearAuthCookies(res);
        this.authService.clearAuthCookiesOnRequest(req);
      }
      return;
    }

    try {
      const result = await this.authService.refresh(refreshToken);
      this.authService.setAuthCookies(res, result);
      this.authService.setAuthCookiesOnRequest(req, result);
    } catch (error) {
      console.error('Token refresh failed:', error);
      if (options.clearCookiesOnFailure) {
        this.authService.clearAuthCookies(res);
        this.authService.clearAuthCookiesOnRequest(req);
      }
    }
  }
}
