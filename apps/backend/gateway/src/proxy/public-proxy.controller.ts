import { Controller, Get, Next, Post, Req, Res } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { Public } from '../decorators/public.decorator';
import { OptionalAuth } from '../decorators/optional-auth.decorator';

import { ProxyService } from './proxy.service';

/**
 * Public Proxy Controller
 * Handles public API requests that do not require JWT authentication.
 * All routes are forwarded to corresponding microservices via ProxyService.
 */
@Public()
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
}
