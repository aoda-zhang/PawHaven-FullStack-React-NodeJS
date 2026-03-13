import { Controller, All, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

import { ProxyService } from './proxy.service';

@Controller()
export class ProtectedProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('/:service/*path')
  proxyRequests(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    this.proxyService.proxyRequest(req, res, next);
  }
}
