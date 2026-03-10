import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  Res,
  Req,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { httpBusinessMappingCodes } from '@pawhaven/backend-core/constants';

import { LoginDTO } from './dtos/login.dto';
import { RegisterDTO } from './dtos/register.dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Body() loginDto: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    this.authService.setAuthCookies(res, result);

    // Return user info only (not tokens)
    return {
      user: result.user,
      expires_in: result.expires_in,
    };
  }

  @Post('/register')
  async register(
    @Body() registerDto: RegisterDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(
      registerDto.email,
      registerDto.password,
    );

    this.authService.setAuthCookies(res, result);

    // Return user info only (not tokens)
    return {
      user: result.user,
      expires_in: result.expires_in,
    };
  }

  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.authService.getTokenFromRequest(req, 'refresh');

    if (!refreshToken) {
      throw new BadRequestException(httpBusinessMappingCodes.invalidToken);
    }

    const result = await this.authService.refresh(refreshToken);

    this.authService.setAuthCookies(res, result);

    // Return user info only
    return {
      user: result.user,
      expires_in: result.expires_in,
    };
  }

  @Post('/logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const userId = req.headers['x-auth-user-id'];
    const verified = req.headers['x-auth-verified'];

    if (verified !== '1' || typeof userId !== 'string') {
      throw new UnauthorizedException(httpBusinessMappingCodes.unauthorized);
    }

    await this.authService.logout(userId);

    this.authService.clearAuthCookies(res);

    return { message: 'Logout successful' };
  }
}
