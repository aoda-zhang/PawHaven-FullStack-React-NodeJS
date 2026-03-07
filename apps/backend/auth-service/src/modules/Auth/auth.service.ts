import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtVerifyInfo, AuthResponseDto } from '@pawhaven/shared/types';
import * as bcrypt from 'bcrypt';
import {
  databaseEngines,
  httpBusinessMappingCodes,
} from '@pawhaven/backend-core/constants';
import { InjectPrisma } from '@pawhaven/backend-core';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prismaClient';

@Injectable()
export class AuthService {
  private tokenExpire: number;

  private refreshTokenExpire: number;

  private refreshTokenMaxAge: number;

  private readonly accessCookieName: string;

  private readonly refreshCookieName: string;

  private readonly baseCookieOptions: {
    httpOnly: true;
    secure: boolean;
    sameSite: 'strict';
    path: '/';
  };

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectPrisma(databaseEngines.mongodb)
    private prisma: PrismaClient,
  ) {
    const configuredAccessExpire = this.config.get<number>('auth.jwtExpiresIn');
    const configuredRefreshExpire = this.config.get<number>(
      'auth.refreshTokenExpiresIn',
    );

    this.tokenExpire = configuredAccessExpire || 60;
    this.refreshTokenExpire = configuredRefreshExpire || 604800;
    this.refreshTokenMaxAge = this.refreshTokenExpire * 1000;

    const env = this.config.get<string>('http.env');
    const isProduction = env === 'prod' || env === 'production';
    this.accessCookieName = isProduction
      ? '__Host-access-token'
      : 'access_token';
    this.refreshCookieName = isProduction
      ? '__Host-refresh-token'
      : 'refresh_token';
    this.baseCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    };
  }

  /**
   * Sign and return JWT token
   */
  private signToken(payload: Omit<JwtVerifyInfo, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.tokenExpire,
    });
  }

  private generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { userId },
      { expiresIn: this.refreshTokenExpire },
    );
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

  async verifyToken(token: string): Promise<JwtVerifyInfo> {
    try {
      return await this.jwtService.verifyAsync<JwtVerifyInfo>(token);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      throw new BadRequestException(httpBusinessMappingCodes.invalidToken);
    }
  }

  getTokenFromRequest(
    req: Request,
    type: 'access' | 'refresh',
  ): string | undefined {
    const cookieName =
      type === 'access' ? this.accessCookieName : this.refreshCookieName;
    return req.cookies?.[cookieName];
  }

  setAuthCookies(res: Response, result: AuthResponseDto): void {
    const accessMaxAge = result.expires_in * 1000;

    res.cookie(this.accessCookieName, result.access_token, {
      ...this.baseCookieOptions,
      maxAge: accessMaxAge,
    });

    if (result.refresh_token) {
      res.cookie(this.refreshCookieName, result.refresh_token, {
        ...this.baseCookieOptions,
        maxAge: this.refreshTokenMaxAge,
      });
    }
  }

  setAuthCookiesOnRequest(req: Request, result: AuthResponseDto): void {
    const cookies = req.cookies ?? {};
    cookies[this.accessCookieName] = result.access_token;

    if (result.refresh_token) {
      cookies[this.refreshCookieName] = result.refresh_token;
    }
    // eslint-disable-next-line no-param-reassign
    req.cookies = cookies;
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(this.accessCookieName, { path: '/' });
    res.clearCookie(this.refreshCookieName, { path: '/' });
  }

  clearAuthCookiesOnRequest(req: Request): void {
    if (req.cookies) {
      const cookies = { ...req.cookies };
      delete cookies[this.accessCookieName];
      delete cookies[this.refreshCookieName];
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
      throw new BadRequestException(
        httpBusinessMappingCodes.invalidCredentials,
      );
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException(
        httpBusinessMappingCodes.invalidCredentials,
      );
    }

    const token = this.signToken({ userId: user.id, email: user.email });
    const refreshToken = this.generateRefreshToken(user.id);
    const hashedRefreshToken = await this.hashPassword(refreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      access_token: token,
      expires_in: this.tokenExpire,
      refresh_token: refreshToken,
      user: {
        id: user.id,
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

    const token = this.signToken({
      userId: newUser.id,
      email: newUser.email,
    });

    const refreshToken = this.generateRefreshToken(newUser.id);
    const hashedRefreshToken = await this.hashPassword(refreshToken);

    await this.prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      access_token: token,
      expires_in: this.tokenExpire,
      refresh_token: refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload = await this.verifyToken(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.refreshToken) {
      throw new BadRequestException(
        httpBusinessMappingCodes.invalidRefreshToken,
      );
    }

    const isRefreshTokenValid = await this.comparePassword(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new BadRequestException(
        httpBusinessMappingCodes.invalidRefreshToken,
      );
    }

    const newAccessToken = this.signToken({
      userId: user.id,
      email: user.email,
    });

    const newRefreshToken = this.generateRefreshToken(user.id);
    const newHashedRefreshToken = await this.hashPassword(newRefreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newHashedRefreshToken },
    });

    return {
      access_token: newAccessToken,
      expires_in: this.tokenExpire,
      refresh_token: newRefreshToken,
      user: {
        id: user.id,
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
