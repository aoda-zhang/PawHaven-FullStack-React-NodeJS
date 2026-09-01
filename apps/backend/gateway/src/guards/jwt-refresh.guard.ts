import {
  HttpException,
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtVerifyInfo, User } from '@pawhaven/shared/types';
import { HttpClientService } from '@pawhaven/backend-core';
import { cookieKeys, httpHeaders } from '@pawhaven/backend-core/constants';
import { isProd } from '@pawhaven/shared/utils';

import { IS_PUBLIC_API } from '../decorators/public.decorator';
import { IS_OPTIONAL_AUTH } from '../decorators/optional-auth.decorator';

type RequestWithUser = Request & { user?: User };

const MS_PER_SECOND = 1000;
const CLIENT_ERROR_STATUS_MIN = 400;
const CLIENT_ERROR_STATUS_MAX = 500;

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  private readonly logger = new Logger(JwtRefreshGuard.name);

  private readonly refreshInflight = new Map<
    string,
    Promise<string[] | null>
  >();

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
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH,
      [context.getHandler(), context.getClass()],
    );

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const res = context.switchToHttp().getResponse<Response>();
    const accessToken = req.cookies?.[cookieKeys.access_token];

    if (isPublic) {
      return true;
    }

    if (!accessToken) {
      await this.attemptTokenRefresh(req, res, {
        clearCookiesOnFailure: true,
        isOptionalAuth,
      });
      return true;
    }

    const accessPayload = this.verifyAccessToken(accessToken);
    if (!accessPayload) {
      await this.attemptTokenRefresh(req, res, {
        clearCookiesOnFailure: true,
        isOptionalAuth,
      });
      return true;
    }

    if (this.shouldRefreshSoon(accessPayload)) {
      await this.attemptTokenRefresh(req, res, {
        clearCookiesOnFailure: false,
        isOptionalAuth: true, // Don't throw on proactive refresh failure - token is still valid
      });
    }

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

  private shouldRefreshSoon(payload: JwtVerifyInfo): boolean {
    if (!payload.exp) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / MS_PER_SECOND);
    const remainingSeconds = payload.exp - nowInSeconds;
    const refreshWindowSeconds = this.getRefreshWindowSeconds(payload);

    return remainingSeconds <= refreshWindowSeconds;
  }

  private getRefreshWindowSeconds(payload: JwtVerifyInfo): number {
    const fallbackSeconds = Math.floor(
      this.configService.getOrThrow<number>('auth.jwtRefreshFallbackSeconds'),
    );
    const windowPercentage = this.configService.getOrThrow<number>(
      'auth.jwtRefreshWindowPercentage',
    );

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
    options: { clearCookiesOnFailure: boolean; isOptionalAuth: boolean },
  ): Promise<void> {
    const refreshToken = req.cookies?.[cookieKeys.refresh_token];

    if (!refreshToken) {
      this.logger.warn('refresh token missing');
      if (options.clearCookiesOnFailure) {
        this.clearAuthCookies(req, res);
      }
      if (!options.isOptionalAuth) {
        throw new UnauthorizedException('Authentication required');
      }
      return;
    }

    let inflight = this.refreshInflight.get(refreshToken);
    if (!inflight) {
      inflight = this.performRefresh(refreshToken);
      this.refreshInflight.set(refreshToken, inflight);
      inflight
        .catch(() => undefined)
        .finally(() => this.refreshInflight.delete(refreshToken));
    }

    try {
      const setCookieHeaders = await inflight;
      if (Array.isArray(setCookieHeaders) && setCookieHeaders.length > 0) {
        this.updateAuthCookies(req, res, setCookieHeaders);
        this.setUserFromRefreshedToken(req);
      } else {
        this.logger.warn('Token refresh succeeded but no Set-Cookie returned');
      }
    } catch (error) {
      this.logger.error('Token refresh failed', error as Error);
      if (options.clearCookiesOnFailure || this.isRefreshRejected(error)) {
        this.clearAuthCookies(req, res);
      }
      if (!options.isOptionalAuth) {
        throw new UnauthorizedException('Session expired, please login again');
      }
    }
  }

  private async performRefresh(refreshToken: string): Promise<string[] | null> {
    const authClient = this.httpClientService.create('auth-service');
    const response = await authClient.post<unknown>(
      '/auth-service/refresh',
      {},
      {
        returnResponse: true,
        headers: {
          [httpHeaders.cookie]: `${cookieKeys.refresh_token}=${refreshToken}`,
        },
      },
    );

    const setCookieHeaders = response.headers[httpHeaders.setCookie];
    return Array.isArray(setCookieHeaders) ? setCookieHeaders : null;
  }

  private setUserFromRefreshedToken(req: RequestWithUser): void {
    const refreshedToken = req.cookies?.[cookieKeys.access_token];
    if (!refreshedToken) {
      return;
    }

    const payload = this.jwtService.decode<JwtVerifyInfo>(refreshedToken);
    if (payload?.userId) {
      // eslint-disable-next-line no-param-reassign
      req.user = {
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles,
      };
    }
  }

  private isRefreshRejected(error: unknown): boolean {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      return (
        status >= CLIENT_ERROR_STATUS_MIN && status < CLIENT_ERROR_STATUS_MAX
      );
    }
    const response = (error as { response?: { status?: number } })?.response;
    return (
      typeof response?.status === 'number' &&
      response.status >= CLIENT_ERROR_STATUS_MIN &&
      response.status < CLIENT_ERROR_STATUS_MAX
    );
  }

  private updateAuthCookies(
    req: Request,
    res: Response,
    setCookieHeaders: string[],
  ): void {
    setCookieHeaders.forEach((cookie) => {
      res.append(httpHeaders.setCookie, cookie);
      const match = cookie.match(/^([^=]+)=([^;]+)/);
      if (match) {
        const [, name, value] = match;
        // eslint-disable-next-line no-param-reassign
        req.cookies = req.cookies ?? {};
        // eslint-disable-next-line no-param-reassign
        req.cookies[name] = value;
        this.upsertCookieHeader(req, name, value);
      }
    });
  }

  private upsertCookieHeader(req: Request, name: string, value: string): void {
    const parts = (req.headers[httpHeaders.cookie] ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean);
    const entry = `${name}=${value}`;
    const index = parts.findIndex((part) => part.startsWith(`${name}=`));
    if (index >= 0) {
      parts[index] = entry;
    } else {
      parts.push(entry);
    }
    // eslint-disable-next-line no-param-reassign
    req.headers[httpHeaders.cookie] = parts.join('; ');
  }

  private clearAuthCookies(req: Request, res: Response): void {
    const cookieOptions = 'Path=/; Max-Age=0; HttpOnly; SameSite=Strict';
    const env = this.configService.get<string>('http.env');
    const secureSuffix = isProd(env) ? '; Secure' : '';

    res.append(
      httpHeaders.setCookie,
      `${cookieKeys.access_token}=; ${cookieOptions}${secureSuffix}`,
    );
    res.append(
      httpHeaders.setCookie,
      `${cookieKeys.refresh_token}=; ${cookieOptions}${secureSuffix}`,
    );

    // eslint-disable-next-line no-param-reassign
    req.cookies = req.cookies ?? {};
    // eslint-disable-next-line no-param-reassign
    delete req.cookies[cookieKeys.access_token];
    // eslint-disable-next-line no-param-reassign
    delete req.cookies[cookieKeys.refresh_token];
    if (req.headers[httpHeaders.cookie]) {
      const parts = (req.headers[httpHeaders.cookie] ?? '')
        .split(';')
        .map((part) => part.trim())
        .filter(
          (part) =>
            !part.startsWith(`${cookieKeys.access_token}=`) &&
            !part.startsWith(`${cookieKeys.refresh_token}=`),
        );
      // eslint-disable-next-line no-param-reassign
      req.headers[httpHeaders.cookie] = parts.join('; ');
    }
  }
}
