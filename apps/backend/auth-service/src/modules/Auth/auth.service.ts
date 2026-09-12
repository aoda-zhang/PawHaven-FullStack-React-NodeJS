import crypto from 'node:crypto';

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { httpBusinessMappingCodes } from '@pawhaven/shared';
import {
  JwtVerifyInfo,
  AuthResponseDto,
  AuthUser,
} from '@pawhaven/shared/types';
import { isProd } from '@pawhaven/shared/utils';
import * as bcrypt from 'bcrypt';
import { databaseEngines, cookieKeys } from '@pawhaven/backend-core/constants';
import { InjectPrisma } from '@pawhaven/backend-core';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prismaClient';

type SessionClaims = {
  sessionExpiresAt: number;
};

const REFRESH_TOKEN_BYTES = 32;
const MS_PER_SECOND = 1000;
const SESSION_EXPIRED_MESSAGE = 'Session expired, please login again';

const nowInSeconds = (): number => Math.floor(Date.now() / MS_PER_SECOND);

@Injectable()
export class AuthService {
  private readonly cookieConfig: {
    names: {
      access: string;
      refresh: string;
    };
    sameSite: {
      access: 'lax' | 'strict' | 'none';
      refresh: 'lax' | 'strict' | 'none';
    };
    baseOptions: {
      httpOnly: true;
      secure: boolean;
      path: '/';
    };
  };

  private readonly tokenConfig: {
    expiresIn: {
      access: number;
      refresh: number;
    };
    sessionExpiresIn: number;
    rotationWindowSeconds: number;
    maxAge: {
      refresh: number;
    };
  };

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectPrisma(databaseEngines.mongodb)
    private prisma: PrismaClient,
  ) {
    const accessExpiresIn = this.config.getOrThrow<number>('auth.jwtExpiresIn');
    const refreshExpiresIn = this.config.getOrThrow<number>(
      'auth.refreshTokenExpiresIn',
    );
    const sessionExpiresIn = this.config.getOrThrow<number>(
      'auth.sessionExpiresIn',
    );
    const refreshRotationWindowSeconds = this.config.getOrThrow<number>(
      'auth.refreshTokenRotationWindowSeconds',
    );

    this.tokenConfig = {
      expiresIn: {
        access: accessExpiresIn,
        refresh: refreshExpiresIn,
      },
      sessionExpiresIn,
      rotationWindowSeconds: refreshRotationWindowSeconds,
      maxAge: {
        refresh: refreshExpiresIn * 1000,
      },
    };

    const env = this.config.get<string>('http.env');
    const isProdEnv = isProd(env);

    this.cookieConfig = {
      names: {
        access: cookieKeys.access_token,
        refresh: cookieKeys.refresh_token,
      },
      sameSite: {
        access: 'lax',
        refresh: 'strict',
      },
      baseOptions: {
        httpOnly: true,
        secure: isProdEnv,
        path: '/',
      },
    };
  }

  private signToken(
    payload: Pick<JwtVerifyInfo, 'userId' | 'email' | 'roles'>,
    session: SessionClaims,
  ): string {
    return this.jwtService.sign(
      {
        ...payload,
        type: 'access',
        ...session,
      },
      { expiresIn: this.tokenConfig.expiresIn.access },
    );
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getSessionClaims(): SessionClaims {
    return {
      sessionExpiresAt: nowInSeconds() + this.tokenConfig.sessionExpiresIn,
    };
  }

  private resolveSessionClaims(user: {
    sessionExpiresAt: number | null;
  }): SessionClaims {
    return {
      sessionExpiresAt:
        user.sessionExpiresAt ??
        nowInSeconds() + this.tokenConfig.sessionExpiresIn,
    };
  }

  private isSessionExpired(sessionExpiresAt: number | null): boolean {
    if (typeof sessionExpiresAt !== 'number') {
      return false;
    }
    return sessionExpiresAt <= nowInSeconds();
  }

  private shouldRotateRefreshToken(refreshTokenExpiresAt: number): boolean {
    return (
      refreshTokenExpiresAt - nowInSeconds() <=
      this.tokenConfig.rotationWindowSeconds
    );
  }

  private getRefreshTokenExpiresAt(session: SessionClaims): number {
    return Math.min(
      nowInSeconds() + this.tokenConfig.expiresIn.refresh,
      session.sessionExpiresAt,
    );
  }

  private async revokeRefreshToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExpiresAt: null,
        sessionExpiresAt: null,
      },
    });
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  getTokenFromRequest(
    req: Request,
    type: 'access' | 'refresh',
  ): string | undefined {
    const cookieName =
      type === 'access'
        ? this.cookieConfig.names.access
        : this.cookieConfig.names.refresh;
    return req.cookies?.[cookieName];
  }

  setAuthCookies(res: Response, result: AuthResponseDto): void {
    const accessMaxAge = result.expires_in * 1000;

    res.cookie(this.cookieConfig.names.access, result.access_token, {
      ...this.cookieConfig.baseOptions,
      sameSite: this.cookieConfig.sameSite.access,
      maxAge: accessMaxAge,
    });

    if (result.refresh_token) {
      res.cookie(this.cookieConfig.names.refresh, result.refresh_token, {
        ...this.cookieConfig.baseOptions,
        sameSite: this.cookieConfig.sameSite.refresh,
        maxAge: this.getRefreshCookieMaxAge(result),
      });
    }
  }

  private getRefreshCookieMaxAge(result: AuthResponseDto): number {
    if (typeof result.session_expires_at !== 'number') {
      return this.tokenConfig.maxAge.refresh;
    }
    const remainingMs = result.session_expires_at * 1000 - Date.now();
    if (remainingMs <= 0) {
      return 0;
    }
    return Math.min(this.tokenConfig.maxAge.refresh, remainingMs);
  }

  setAuthCookiesOnRequest(req: Request, result: AuthResponseDto): void {
    const cookies = req.cookies ?? {};
    cookies[this.cookieConfig.names.access] = result.access_token;

    if (result.refresh_token) {
      cookies[this.cookieConfig.names.refresh] = result.refresh_token;
    }
    // eslint-disable-next-line no-param-reassign
    req.cookies = cookies;
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(this.cookieConfig.names.access, { path: '/' });
    res.clearCookie(this.cookieConfig.names.refresh, { path: '/' });
  }

  clearAuthCookiesOnRequest(req: Request): void {
    if (req.cookies) {
      const cookies = { ...req.cookies };
      delete cookies[this.cookieConfig.names.access];
      delete cookies[this.cookieConfig.names.refresh];
      // eslint-disable-next-line no-param-reassign
      req.cookies = cookies;
    }
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(
        httpBusinessMappingCodes.invalidCredentials,
      );
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        httpBusinessMappingCodes.invalidCredentials,
      );
    }

    const session = this.getSessionClaims();
    const token = this.signToken(
      { userId: user.id, email: user.email },
      session,
    );
    const refreshToken = this.generateRefreshToken();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: this.hashRefreshToken(refreshToken),
        refreshTokenExpiresAt: this.getRefreshTokenExpiresAt(session),
        sessionExpiresAt: session.sessionExpiresAt,
      },
    });

    return {
      access_token: token,
      expires_in: this.tokenConfig.expiresIn.access,
      refresh_token: refreshToken,
      session_expires_at: session.sessionExpiresAt,
      user: {
        userId: user.id,
        email: user.email,
      },
    };
  }

  /**
   * Register new user
   */
  async register(email: string, password: string): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(httpBusinessMappingCodes.userAlreadyExists);
    }

    const hashedPassword = await this.hashPassword(password);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const session = this.getSessionClaims();
    const token = this.signToken(
      { userId: newUser.id, email: newUser.email },
      session,
    );
    const refreshToken = this.generateRefreshToken();

    await this.prisma.user.update({
      where: { id: newUser.id },
      data: {
        refreshToken: this.hashRefreshToken(refreshToken),
        refreshTokenExpiresAt: this.getRefreshTokenExpiresAt(session),
        sessionExpiresAt: session.sessionExpiresAt,
      },
    });

    return {
      access_token: token,
      expires_in: this.tokenConfig.expiresIn.access,
      refresh_token: refreshToken,
      session_expires_at: session.sessionExpiresAt,
      user: {
        userId: newUser.id,
        email: newUser.email,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { refreshToken: this.hashRefreshToken(refreshToken) },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException(
        httpBusinessMappingCodes.invalidRefreshToken,
      );
    }

    if (this.isSessionExpired(user.sessionExpiresAt)) {
      await this.revokeRefreshToken(user.id);
      throw new UnauthorizedException(SESSION_EXPIRED_MESSAGE);
    }

    if (
      typeof user.refreshTokenExpiresAt !== 'number' ||
      user.refreshTokenExpiresAt <= nowInSeconds()
    ) {
      await this.revokeRefreshToken(user.id);
      throw new UnauthorizedException(
        httpBusinessMappingCodes.invalidRefreshToken,
      );
    }

    const session = this.resolveSessionClaims(user);
    const newAccessToken = this.signToken(
      {
        userId: user.id,
        email: user.email,
      },
      session,
    );

    let refreshTokenToUse = refreshToken;
    if (this.shouldRotateRefreshToken(user.refreshTokenExpiresAt)) {
      refreshTokenToUse = this.generateRefreshToken();

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: this.hashRefreshToken(refreshTokenToUse),
          refreshTokenExpiresAt: this.getRefreshTokenExpiresAt(session),
        },
      });
    }

    return {
      access_token: newAccessToken,
      expires_in: this.tokenConfig.expiresIn.access,
      refresh_token: refreshTokenToUse,
      session_expires_at: session.sessionExpiresAt,
      user: {
        userId: user.id,
        email: user.email,
      },
    };
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException(httpBusinessMappingCodes.unauthorized);
    }

    return { userId: user.id, email: user.email };
  }

  /**
   * Logout user by clearing refresh token
   */
  async logout(userId: string): Promise<void> {
    await this.revokeRefreshToken(userId);
  }
}
