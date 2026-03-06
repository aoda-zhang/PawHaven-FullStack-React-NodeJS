import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PrismaClient } from '@prisma/client';
import { JwtPayload, AuthResponseDto } from '@pawhaven/shared/types';
import * as bcrypt from 'bcrypt';
import {
  databaseEngines,
  httpBusinessMappingCodes,
} from '@pawhaven/backend-core/constants';
import { InjectPrisma } from '@pawhaven/backend-core';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private tokenExpire: number;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectPrisma(databaseEngines.mongodb)
    private prisma: PrismaClient,
  ) {
    this.tokenExpire = this.config.get<number>('auth.jwtExpiresIn') || 1800;
  }

  /**
   * Sign and return JWT token
   */
  private signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload);
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

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return payload;
    } catch {
      throw new BadRequestException(
        httpBusinessMappingCodes.invalidToken || 'Invalid or expired token',
      );
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
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }
    const token = this.signToken({ userId: user.id, email: user.email });

    return {
      access_token: token,
      expires_in: this.tokenExpire,
      user: {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
      },
    };
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    username?: string,
  ): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username: username || null,
      },
    });

    const token = this.signToken({
      userId: newUser.id,
      email: newUser.email,
    });

    return {
      access_token: token,
      expires_in: this.tokenExpire,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser?.username ?? undefined,
      },
    };
  }

  /**
   * Verify token from header
   */
  async verify(token: string): Promise<JwtPayload> {
    return this.verifyToken(token);
  }
}
