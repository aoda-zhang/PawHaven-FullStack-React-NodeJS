import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  Res,
  Req,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';
import {
  CredentialsSchema,
  type AuthUser,
  type CredentialsDto,
  type SessionDto,
} from '@pawhaven/shared/types';
import { httpBusinessMappingCodes } from '@pawhaven/shared';
import { Public } from '@pawhaven/backend-core/decorators';
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';

import { AuthService } from './auth.service.js';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/login')
  async login(
    @Body({ schema: CredentialsSchema }) loginDto: CredentialsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionDto> {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    this.authService.setAuthCookies(res, result);

    return {
      user: result.user,
      expires_in: result.expires_in,
      session_expires_at: result.session_expires_at,
    };
  }

  @Public()
  @Post('/register')
  async register(
    @Body({ schema: CredentialsSchema }) registerDto: CredentialsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionDto> {
    const result = await this.authService.register(
      registerDto.email,
      registerDto.password,
    );

    this.authService.setAuthCookies(res, result);

    return {
      user: result.user,
      expires_in: result.expires_in,
      session_expires_at: result.session_expires_at,
    };
  }

  @Public()
  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionDto> {
    const refreshToken = this.authService.getTokenFromRequest(req, 'refresh');

    if (!refreshToken) {
      throw new UnauthorizedException(httpBusinessMappingCodes.invalidToken);
    }

    const result = await this.authService.refresh(refreshToken);

    this.authService.setAuthCookies(res, result);

    return {
      user: result.user,
      expires_in: result.expires_in,
      session_expires_at: result.session_expires_at,
    };
  }

  @Public()
  @Post('/logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = this.authService.getTokenFromRequest(req, 'refresh');

    await this.authService.logout(refreshToken);

    this.authService.clearAuthCookies(res);

    return { message: 'Logout successful' };
  }

  @Get('/me')
  async me(@InternalJwt() claims: AuthenticatedInternalJwt): Promise<AuthUser> {
    return this.authService.getCurrentUser(claims.sub);
  }

  @Public()
  @Get('/volunteer-count')
  async getVolunteerCount(): Promise<{ count: number }> {
    return { count: await this.authService.getVolunteerCount() };
  }

  @Post('/volunteer/opt-in')
  async optInVolunteer(
    @InternalJwt() claims: AuthenticatedInternalJwt,
  ): Promise<{ success: boolean }> {
    await this.authService.optInVolunteer(claims.sub);
    return { success: true };
  }
}
