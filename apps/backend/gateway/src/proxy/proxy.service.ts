/* eslint-disable no-param-reassign */
import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import { BadGatewayException, Injectable } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import {
  createProxyMiddleware,
  fixRequestBody,
  RequestHandler,
  responseInterceptor,
} from 'http-proxy-middleware';
import { ConfigService } from '@nestjs/config';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import { readHeader } from '@pawhaven/backend-core/utils';
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
        selfHandleResponse: true,
        logger: console,
        on: {
          proxyReq: this.handleProxyReq.bind(this),
          proxyRes: responseInterceptor(this.wrapEnvelope.bind(this)),
        },
      });
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  /**
   * Wrap every successful JSON response into the global envelope
   * { status, isSuccess, message, code, data } (ADR-002). Binary responses
   * (pdf/image/octet-stream) and non-2xx errors pass through untouched so the
   * frontend error handler can read code/message from the raw body.
   */
  private async wrapEnvelope(
    buffer: Buffer,
    proxyRes: IncomingMessage,
    req: Request,
    res: Response,
  ): Promise<Buffer | string> {
    const traceId =
      readHeader(req.headers, httpHeaders.traceId) ?? crypto.randomUUID();
    res.setHeader(httpHeaders.traceId, traceId);
    res.setHeader('Referrer-Policy', 'no-referrer');

    const contentType =
      readHeader(proxyRes.headers, httpHeaders.contentType) ?? '';
    const isJson = contentType.includes('application/json');
    const { statusCode } = res;

    if (!isJson || statusCode < 200 || statusCode >= 300) {
      return buffer;
    }

    const body = JSON.parse(buffer.toString('utf8') || 'null');

    // Avoid double-wrapping if an upstream service already enveloped.
    if (body && typeof body === 'object' && 'isSuccess' in body) {
      return buffer;
    }

    return JSON.stringify({
      status: statusCode,
      isSuccess: true,
      message: 'ok',
      code: '0',
      data: body,
    });
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
    delete req.headers[httpHeaders.authUserId];
    delete req.headers[httpHeaders.authUserEmail];
    delete req.headers[httpHeaders.authVerified];
    delete req.headers[httpHeaders.authUserRoles];

    const { user } = req;

    if (user?.userId) {
      proxyReq.setHeader(httpHeaders.authUserId, user.userId);
      proxyReq.setHeader(httpHeaders.authVerified, '1');
      if (user.email) {
        proxyReq.setHeader(httpHeaders.authUserEmail, user.email);
      }
      if (Array.isArray(user.roles) && user.roles.length > 0) {
        proxyReq.setHeader(httpHeaders.authUserRoles, user.roles.join(','));
      }
    } else {
      proxyReq.setHeader(httpHeaders.authVerified, '0');
    }

    fixRequestBody(proxyReq, req);
  }

  private rewritePath(path: string, req: Request): string {
    const MSOptions = this.getCurrentMSOption(req);
    if (MSOptions?.gatewayPrefix && MSOptions?.pathRewrite) {
      return path.replace(MSOptions?.gatewayPrefix, MSOptions.pathRewrite);
    }
    return path;
  }
}
