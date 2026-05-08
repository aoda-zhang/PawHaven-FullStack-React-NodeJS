import { Controller, Get, Next, Post, Req, Res } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { OptionalAuth } from '../decorators/optional-auth.decorator';

import { ProxyService } from './proxy.service';

/**
 * Public Proxy Controller
 * Handles public API requests.
 * Routes without @Public require JWT authentication.
 */
@Controller()
export class PublicProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('/auth/login')
  proxyAuthLogin(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    this.proxyService.proxyRequest(req, res, next);
  }

  @Post('/auth/register')
  proxyAuthRegister(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    this.proxyService.proxyRequest(req, res, next);
  }

  @Post('/auth/refresh')
  proxyAuthRefresh(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    this.proxyService.proxyRequest(req, res, next);
  }

  @OptionalAuth()
  @Get('/core/app/bootstrap')
  proxyCoreBootstrap(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    this.proxyService.proxyRequest(req, res, next);
  }

  @OptionalAuth()
  @Get('/core/rescues')
  proxyGetRescues(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    this.proxyService.proxyRequest(req, res, next);
  }

  @OptionalAuth()
  @Get('/core/rescues/:id')
  proxyGetRescueById(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    this.proxyService.proxyRequest(req, res, next);
  }
}
