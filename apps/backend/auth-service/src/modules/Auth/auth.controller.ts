import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Res,
  Req,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtVerifyInfo } from '@pawhaven/shared/types';
import { httpBusinessMappingCodes } from '@pawhaven/backend-core/constants';
import { PublicAPI } from '@pawhaven/backend-core/decorators';

import { LoginDTO } from './dtos/login.dto';
import { RegisterDTO } from './dtos/register.dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/verify')
  async verify(@Req() req: Request): Promise<JwtVerifyInfo> {
    const token = this.authService.getTokenFromRequest(req, 'access');

    if (!token) {
      throw new BadRequestException(httpBusinessMappingCodes.invalidToken);
    }

    const verifyInfo = await this.authService.verifyToken(token);
    return verifyInfo;
  }

  @PublicAPI()
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

  @PublicAPI()
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

  @PublicAPI()
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
    const token = this.authService.getTokenFromRequest(req, 'access');

    if (!token) {
      throw new BadRequestException(httpBusinessMappingCodes.invalidToken);
    }

    const claims = await this.authService.verifyToken(token);
    await this.authService.logout(claims.userId);

    this.authService.clearAuthCookies(res);

    return { message: 'Logout successful' };
  }
}
