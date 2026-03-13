import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtVerifyInfo } from '@pawhaven/shared/types';
import { HttpClientService } from '@pawhaven/backend-core';
import { cookieKeys } from '@pawhaven/backend-core/constants';
import { isProd } from '@pawhaven/shared/utils';

import { IS_PUBLIC_API } from '../decorators/public.decorator';

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  private readonly logger = new Logger(JwtRefreshGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly httpClientService: HttpClientService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_API, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const accessToken = req.cookies?.[cookieKeys.access_token];
    if (!accessToken) {
      await this.attemptTokenRefresh(req, res, {
        clearCookiesOnFailure: true,
      });
      return true;
    }

    const accessPayload = this.verifyAccessToken(accessToken);
    if (!accessPayload) {
      await this.attemptTokenRefresh(req, res, {
        clearCookiesOnFailure: true,
      });
      return true;
    }

    if (this.shouldRefreshSoon(accessPayload)) {
      await this.attemptTokenRefresh(req, res, {
        clearCookiesOnFailure: false,
      });
    }

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
      const authClient = this.httpClientService.create('auth-service');
      const response = await authClient.post<unknown>(
        '/auth-service/refresh',
        {},
        {
          returnResponse: true,
          headers: {
            Cookie: `${cookieKeys.refresh_token}=${refreshToken}`,
          },
        },
      );

      const setCookieHeaders = response.headers['set-cookie'];
      if (Array.isArray(setCookieHeaders) && setCookieHeaders.length > 0) {
        this.updateAuthCookies(req, res, setCookieHeaders);
      } else {
        this.logger.warn('Token refresh succeeded but no Set-Cookie returned');
      }
    } catch (error) {
      this.logger.error('Token refresh failed', error as Error);
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
    res.setHeader('Set-Cookie', setCookieHeaders);

    setCookieHeaders.forEach((cookie) => {
      const match = cookie.match(/^([^=]+)=([^;]+)/);
      if (match) {
        const [, name, value] = match;
        // eslint-disable-next-line no-param-reassign
        req.cookies = req.cookies ?? {};
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
}
