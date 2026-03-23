/* eslint-disable no-param-reassign */
import crypto from 'node:crypto';

import { BadGatewayException, Injectable } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import {
  createProxyMiddleware,
  fixRequestBody,
  RequestHandler,
} from 'http-proxy-middleware';
import { ConfigService } from '@nestjs/config';
import { User } from '@pawhaven/shared/types';

@Injectable()
export class ProxyService {
  private readonly proxyClient: RequestHandler<Request, Response, NextFunction>;

  constructor(private readonly configService: ConfigService) {
    this.proxyClient = this.createProxyClient();
  }

  proxyRequest(req: Request, res: Response, next: NextFunction): void {
    this.proxyClient(req, res, next);
  }

  private createProxyClient(): RequestHandler<Request, Response, NextFunction> {
    try {
      return createProxyMiddleware({
        router: this.resolveTarget.bind(this),
        pathRewrite: this.rewritePath.bind(this),
        ignorePath: false,
        changeOrigin: true,
        logger: console,
        on: {
          proxyReq: this.handleProxyReq.bind(this),
          proxyRes: this.handleProxyRes.bind(this),
        },
      });
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  private resolveTarget(req: Request): string {
    return this.getCurrentMSOption(req)?.host ?? '';
  }

  private getCurrentMSOption(req: Request) {
    const servicePrefix = this.extractServicePrefix(req);
    const allMicroServices = this.configService.get('microServices') ?? [];
    const currentMicroServices = allMicroServices?.find(
      (mic: any) =>
        mic?.options?.gatewayPrefix === servicePrefix && mic?.enable,
    );
    if (currentMicroServices?.options) {
      return currentMicroServices?.options;
    }
    throw new Error(`Service not found`);
  }

  private extractServicePrefix(req: Request): string {
    const segments = req.path.split('/').filter(Boolean).slice(0, 2);
    return `/${segments.join('/')}`;
  }

  private handleProxyReq(proxyReq: any, req: Request & { user?: User }): void {
    delete req.headers['x-auth-user-id'];
    delete req.headers['x-auth-user-email'];
    delete req.headers['x-auth-verified'];
    delete req.headers['x-auth-user-roles'];

    const { user } = req;

    if (user?.userId) {
      proxyReq.setHeader('X-Auth-User-Id', user.userId);
      proxyReq.setHeader('X-Auth-Verified', '1');
      if (user.email) {
        proxyReq.setHeader('X-Auth-User-Email', user.email);
      }
      if (Array.isArray(user.roles) && user.roles.length > 0) {
        proxyReq.setHeader('X-Auth-User-Roles', user.roles.join(','));
      }
    }

    fixRequestBody(proxyReq, req);
  }

  private handleProxyRes(_: any, req: Request, res: Response): void {
    const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID();
    res.setHeader('X-Trace-Id', traceId);
    res.setHeader('Referrer-Policy', 'no-referrer');
  }

  private rewritePath(path: string, req: Request): string {
    const MSOptions = this.getCurrentMSOption(req);
    if (MSOptions?.gatewayPrefix && MSOptions?.pathRewrite) {
      return path.replace(MSOptions?.gatewayPrefix, MSOptions.pathRewrite);
    }
    return path;
  }
}
