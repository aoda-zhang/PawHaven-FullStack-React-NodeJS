import { Controller, All, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  private readonly proxyClient;

  constructor(private readonly proxyService: ProxyService) {
    this.proxyClient = this.proxyService.getProxyClient();
  }

  @All('/:service/*path')
  proxyRequests(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): Promise<void> {
    return this.proxyClient(req, res, next);
  }
}
