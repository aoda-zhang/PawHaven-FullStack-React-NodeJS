/* eslint-disable no-param-reassign */
import crypto from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpClientService } from '@pawhaven/backend-core';
import {
  authRouteSuffixes,
  cookieKeys,
  httpHeaders,
  microServiceNames,
} from '@pawhaven/backend-core/constants';
import {
  InternalJwtKind,
  type JwtVerifyInfo,
} from '@pawhaven/backend-core/types';
import { isProd } from '@pawhaven/shared/utils';
import type { Request, Response } from 'express';

import { InternalJwtService } from '../internal-jwt/internalJwt.service.js';
import { InternalJwtTargetResolver } from '../internal-jwt/internalJwtTarget.resolver.js';
import type { InternalJwtIdentity } from '../internal-jwt/InternalJwt.types.js';

const SESSION_EXPIRED_MESSAGE = 'Session expired, please login again';
const ACCESS_TOKEN_TYPE = 'access';
const MS_PER_SECOND = 1000;
const MINIMUM_REFRESH_WINDOW_SECONDS = 1;
const REFRESH_PATH = '/refresh';
const CLEAR_COOKIE_OPTIONS = 'Path=/; Max-Age=0; HttpOnly; SameSite=Strict';
const PROD_SECURE_SUFFIX = '; Secure';
const COOKIE_ENTRY_PATTERN = /^([^=]+)=([^;]+)/;

@Injectable()
export class IdentityResolver {
  private readonly refreshInflight = new Map<
    string,
    Promise<string[] | null>
  >();

  private readonly clockToleranceSeconds: number;

  private readonly refreshFallbackSeconds: number;

  private readonly refreshWindowPercentage: number;

  private readonly secureSuffix: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpClientService: HttpClientService,
    private readonly internalJwtService: InternalJwtService,
    private readonly internalJwtTargetResolver: InternalJwtTargetResolver,
  ) {
    this.clockToleranceSeconds = this.configService.getOrThrow<number>(
      'auth.jwtClockTolerance',
    );
    this.refreshFallbackSeconds = this.configService.getOrThrow<number>(
      'auth.jwtRefreshFallbackSeconds',
    );
    this.refreshWindowPercentage = this.configService.getOrThrow<number>(
      'auth.jwtRefreshWindowPercentage',
    );
    this.secureSuffix = isProd(this.configService.get<string>('http.env'))
      ? PROD_SECURE_SUFFIX
      : '';
  }

  async resolve(
    req: Request,
    res: Response,
    path: string,
  ): Promise<InternalJwtIdentity> {
    const accessToken = req.cookies?.[cookieKeys.access_token];
    const refreshToken = req.cookies?.[cookieKeys.refresh_token];

    if (!accessToken && !refreshToken) {
      return { kind: InternalJwtKind.ANONYMOUS };
    }

    const accessPayload = this.validPayload(accessToken);

    if (this.isLogoutPath(path)) {
      return accessPayload
        ? this.identityFromPayload(accessPayload)
        : { kind: InternalJwtKind.ANONYMOUS };
    }

    if (accessPayload) {
      if (refreshToken && this.shouldRefreshSoon(accessPayload)) {
        const refreshedPayload = await this.refreshPayload(
          req,
          res,
          refreshToken,
        );
        if (refreshedPayload) {
          return this.identityFromPayload(refreshedPayload);
        }
      }

      return this.identityFromPayload(accessPayload);
    }

    if (refreshToken) {
      const refreshedPayload = await this.refreshPayload(
        req,
        res,
        refreshToken,
      );
      if (refreshedPayload) {
        return this.identityFromPayload(refreshedPayload);
      }
    }

    this.clearCookies(req, res);
    throw new UnauthorizedException(SESSION_EXPIRED_MESSAGE);
  }

  private async adoptRefreshedCookies(
    req: Request,
    res: Response,
    refreshToken: string,
  ): Promise<boolean> {
    const setCookieHeaders = await this.refreshOnce(refreshToken);
    if (!setCookieHeaders || setCookieHeaders.length === 0) {
      return false;
    }
    this.applyCookies(req, res, setCookieHeaders);
    return true;
  }

  private validPayload(token?: string): JwtVerifyInfo | null {
    const payload = this.verifyAccessToken(token);
    return payload && !this.isSessionExpired(payload) ? payload : null;
  }

  private async refreshPayload(
    req: Request,
    res: Response,
    refreshToken: string,
  ): Promise<JwtVerifyInfo | null> {
    const refreshed = await this.adoptRefreshedCookies(req, res, refreshToken);
    if (!refreshed) {
      return null;
    }
    return this.validPayload(req.cookies?.[cookieKeys.access_token]);
  }

  private identityFromPayload(payload: JwtVerifyInfo): InternalJwtIdentity {
    return {
      kind: InternalJwtKind.AUTHENTICATED,
      sub: payload.userId,
      email: payload.email,
      roles: payload.roles,
      username: payload.username,
    };
  }

  private isLogoutPath(path: string): boolean {
    return path.endsWith(authRouteSuffixes.logout);
  }

  private verifyAccessToken(token?: string): JwtVerifyInfo | null {
    if (!token) {
      return null;
    }
    try {
      const payload = this.jwtService.verify<JwtVerifyInfo>(token);
      if (!payload?.userId || payload.type !== ACCESS_TOKEN_TYPE) {
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
    const remainingSeconds = payload.exp - IdentityResolver.nowInSeconds();
    return remainingSeconds <= this.getRefreshWindowSeconds(payload);
  }

  private isSessionExpired(payload: JwtVerifyInfo): boolean {
    const { sessionExpiresAt } = payload;
    return (
      typeof sessionExpiresAt === 'number' &&
      sessionExpiresAt - this.clockToleranceSeconds <=
        IdentityResolver.nowInSeconds()
    );
  }

  private getRefreshWindowSeconds(payload: JwtVerifyInfo): number {
    const fallbackSeconds = Math.floor(this.refreshFallbackSeconds);
    if (!payload.iat || !payload.exp) {
      return fallbackSeconds;
    }
    const tokenLifetimeSeconds = payload.exp - payload.iat;
    if (tokenLifetimeSeconds <= 0) {
      return fallbackSeconds;
    }
    return Math.max(
      MINIMUM_REFRESH_WINDOW_SECONDS,
      Math.floor(tokenLifetimeSeconds * this.refreshWindowPercentage),
    );
  }

  private static nowInSeconds(): number {
    return Math.floor(Date.now() / MS_PER_SECOND);
  }

  private applyCookies(
    req: Request,
    res: Response,
    setCookieHeaders: string[],
  ): void {
    setCookieHeaders.forEach((cookie) => {
      res.append(httpHeaders.setCookie, cookie);
      const match = cookie.match(COOKIE_ENTRY_PATTERN);
      if (match) {
        const [, name, value] = match;
        req.cookies = req.cookies ?? {};
        req.cookies[name] = value;
        this.upsertCookieHeader(req, name, value);
      }
    });
  }

  private clearCookies(req: Request, res: Response): void {
    res.append(
      httpHeaders.setCookie,
      `${cookieKeys.access_token}=; ${CLEAR_COOKIE_OPTIONS}${this.secureSuffix}`,
    );
    res.append(
      httpHeaders.setCookie,
      `${cookieKeys.refresh_token}=; ${CLEAR_COOKIE_OPTIONS}${this.secureSuffix}`,
    );

    req.cookies = req.cookies ?? {};
    delete req.cookies[cookieKeys.access_token];
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
      req.headers[httpHeaders.cookie] = parts.join('; ');
    }
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
    req.headers[httpHeaders.cookie] = parts.join('; ');
  }

  private refreshOnce(refreshToken: string): Promise<string[] | null> {
    const inflight = this.refreshInflight.get(refreshToken);
    if (inflight) {
      return inflight;
    }
    const refreshAttempt = this.requestRefresh(refreshToken).catch(() => null);
    this.refreshInflight.set(refreshToken, refreshAttempt);
    refreshAttempt.finally(() => {
      this.refreshInflight.delete(refreshToken);
    });
    return refreshAttempt;
  }

  private async requestRefresh(refreshToken: string): Promise<string[] | null> {
    const authTarget = this.internalJwtTargetResolver.resolve(
      microServiceNames.AUTH,
    );
    const internalJwtHeaders = this.internalJwtService.sign(
      { kind: InternalJwtKind.ANONYMOUS },
      authTarget,
      crypto.randomUUID(),
    );
    const authClient = this.httpClientService.create(microServiceNames.AUTH);
    const response = await authClient.post<unknown>(
      REFRESH_PATH,
      {},
      {
        returnResponse: true,
        headers: {
          [httpHeaders.cookie]: `${cookieKeys.refresh_token}=${refreshToken}`,
          [httpHeaders.gatewayJwt]: internalJwtHeaders[httpHeaders.gatewayJwt],
        },
      },
    );
    const setCookieHeaders = response.headers[httpHeaders.setCookie];
    return Array.isArray(setCookieHeaders) ? setCookieHeaders : null;
  }
}
