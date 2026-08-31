import { randomUUID } from 'node:crypto';

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  JwtVerifyInfo,
  AuthResponseDto,
  TokenType,
} from '@pawhaven/shared/types';
import { isProd } from '@pawhaven/shared/utils';
import * as bcrypt from 'bcrypt';
import {
  databaseEngines,
  cookieKeys,
  httpBusinessMappingCodes,
} from '@pawhaven/backend-core/constants';
import { InjectPrisma } from '@pawhaven/backend-core';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prismaClient';

type SessionClaims = {
  sessionStartedAt: number;
  sessionExpiresAt: number;
};

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
        jti: randomUUID(),
        ...session,
      },
      { expiresIn: this.tokenConfig.expiresIn.access },
    );
  }

  private generateRefreshToken(
    payload: Pick<JwtVerifyInfo, 'userId' | 'email' | 'roles'>,
    session: SessionClaims,
  ): string {
    return this.jwtService.sign(
      {
        ...payload,
        type: 'refresh',
        jti: randomUUID(),
        ...session,
      },
      { expiresIn: this.tokenConfig.expiresIn.refresh },
    );
  }

  private getSessionClaims(): SessionClaims {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return {
      sessionStartedAt: nowInSeconds,
      sessionExpiresAt: nowInSeconds + this.tokenConfig.sessionExpiresIn,
    };
  }

  private resolveSessionClaims(payload: JwtVerifyInfo): SessionClaims {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return {
      sessionStartedAt: payload.sessionStartedAt ?? nowInSeconds,
      sessionExpiresAt:
        payload.sessionExpiresAt ??
        nowInSeconds + this.tokenConfig.sessionExpiresIn,
    };
  }

  private isSessionExpired(payload: JwtVerifyInfo): boolean {
    if (typeof payload.sessionExpiresAt !== 'number') {
      return false;
    }
    return payload.sessionExpiresAt <= Math.floor(Date.now() / 1000);
  }

  private shouldRotateRefreshToken(payload: JwtVerifyInfo): boolean {
    if (typeof payload.exp !== 'number') {
      return true;
    }
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp - nowInSeconds <= this.tokenConfig.rotationWindowSeconds;
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

  async verifyToken(
    token: string,
    expectedType?: TokenType,
  ): Promise<JwtVerifyInfo> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtVerifyInfo>(token);
      if (expectedType && payload.type !== expectedType) {
        throw new Error('Token type mismatch');
      }
      return payload;
    } catch {
      throw new UnauthorizedException(httpBusinessMappingCodes.invalidToken);
    }
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
    const refreshToken = this.generateRefreshToken(
      {
        userId: user.id,
        email: user.email,
      },
      session,
    );
    const hashedRefreshToken = await this.hashPassword(refreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
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
    const refreshToken = this.generateRefreshToken(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      session,
    );
    const hashedRefreshToken = await this.hashPassword(refreshToken);

    await this.prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken: hashedRefreshToken },
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
    const payload = await this.verifyToken(refreshToken, 'refresh');

    // Absolute session deadline: the session MUST end at sessionExpiresAt
    // even though the refresh token is rotated on an ongoing basis.
    if (this.isSessionExpired(payload)) {
      throw new UnauthorizedException('Session expired, please login again');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException(
        httpBusinessMappingCodes.invalidRefreshToken,
      );
    }

    const isRefreshTokenValid = await this.comparePassword(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException(
        httpBusinessMappingCodes.invalidRefreshToken,
      );
    }

    // Carry the original session window forward; for legacy tokens issued
    // before these claims existed, start a fresh window on first refresh.
    const session = this.resolveSessionClaims(payload);
    const newAccessToken = this.signToken(
      {
        userId: user.id,
        email: user.email,
      },
      session,
    );

    // Rotate the refresh token ONLY when it is close to its own 7-day expiry.
    // Reusing it until then keeps the stored hash stable so in-flight requests
    // carrying the current token stay valid (avoids rotation races that
    // previously killed sessions early).
    let refreshTokenToUse = refreshToken;
    if (this.shouldRotateRefreshToken(payload)) {
      refreshTokenToUse = this.generateRefreshToken(
        {
          userId: user.id,
          email: user.email,
        },
        session,
      );
      const newHashedRefreshToken = await this.hashPassword(refreshTokenToUse);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newHashedRefreshToken },
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

  /**
   * Logout user by clearing refresh token
   */
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
