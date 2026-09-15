/* eslint-disable no-param-reassign */
import crypto from 'node:crypto';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';

import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  createProxyMiddleware,
  fixRequestBody,
  type RequestHandler,
  responseInterceptor,
} from 'http-proxy-middleware';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import { readHeader } from '@pawhaven/backend-core/utils';

import { IdentityResolver } from '../identity/identity.resolver.js';
import { InternalJwtService } from '../internal-jwt/internal-jwt.service.js';
import { InternalJwtTargetResolver } from '../internal-jwt/internal-jwt-target.resolver.js';
import type { MicroServiceConfig } from '../routing/micro-service.config.js';
import { MicroServiceRegistry } from '../routing/micro-service.registry.js';

type PendingInternalJwtHeaders = {
  [httpHeaders.gatewayJwt]: string;
  [httpHeaders.traceId]: string;
};

const HTTP_STATUS_MIN_OK = 200;
const HTTP_STATUS_MIN_REDIRECT = 300;
const HTTP_STATUS_BAD_GATEWAY = 502;
const HTTP_STATUS_GATEWAY_TIMEOUT = 504;
const TIMEOUT_ERROR_CODE = 'ETIMEDOUT';
const SERVICE_PREFIX_SEGMENTS = 2;

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  private readonly proxyClient: RequestHandler<Request, Response, NextFunction>;

  private readonly timeoutMs?: number;

  private readonly pendingInternalJwtHeaders = new WeakMap<
    Request,
    PendingInternalJwtHeaders
  >();

  private readonly requestStartedAt = new WeakMap<Request, number>();

  constructor(
    private readonly configService: ConfigService,
    private readonly identityResolver: IdentityResolver,
    private readonly internalJwtService: InternalJwtService,
    private readonly internalJwtTargetResolver: InternalJwtTargetResolver,
    private readonly microServiceRegistry: MicroServiceRegistry,
  ) {
    this.timeoutMs = this.configService.get<number>('http.timeout');
    this.proxyClient = this.createProxyClient();
  }

  async proxyRequest(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    this.requestStartedAt.set(req, Date.now());
    const microService = this.resolveMicroService(req);
    this.assertSafePath(req, microService);
    this.stripInboundGatewayHeaders(req);
    const traceId = this.ensureTraceId(req);
    const identity = await this.identityResolver.resolve(req, res, req.path);
    const internalJwtHeaders = this.internalJwtService.sign(
      identity,
      this.internalJwtTargetResolver.resolve(microService.name ?? ''),
      traceId,
    );
    this.pendingInternalJwtHeaders.set(req, {
      [httpHeaders.gatewayJwt]: internalJwtHeaders[httpHeaders.gatewayJwt],
      [httpHeaders.traceId]: traceId,
    });
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
        proxyTimeout: this.timeoutMs,
        logger: console,
        on: {
          proxyReq: this.handleProxyReq.bind(this),
          proxyRes: responseInterceptor(this.wrapEnvelope.bind(this)),
          error: this.handleProxyError.bind(this),
        },
      });
    } catch (error) {
      throw new BadGatewayException(error);
    }
  }

  private async wrapEnvelope(
    buffer: Buffer,
    proxyRes: IncomingMessage,
    req: Request,
    res: Response,
  ): Promise<Buffer | string> {
    const traceId = this.ensureTraceId(req);
    res.setHeader(httpHeaders.traceId, traceId);
    res.setHeader('Referrer-Policy', 'no-referrer');

    const contentType =
      readHeader(proxyRes.headers, httpHeaders.contentType) ?? '';
    const isJson = contentType.includes('application/json');
    const { statusCode } = res;

    if (
      !isJson ||
      statusCode < HTTP_STATUS_MIN_OK ||
      statusCode >= HTTP_STATUS_MIN_REDIRECT
    ) {
      return buffer;
    }

    const body = JSON.parse(buffer.toString('utf8') || 'null');
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

  /**
   * `selfHandleResponse` disables http-proxy-middleware's own response handling,
   * so without this handler a failed or timed-out upstream left the client with a
   * destroyed connection and no reply at all — indistinguishable from a hung
   * client, and impossible to diagnose from the caller side.
   */
  private handleProxyError(
    error: Error,
    req: Request,
    res: Response | Socket,
  ): void {
    const traceId = this.ensureTraceId(req);
    // A spent `proxyTimeout` surfaces as a plain socket error (`ECONNRESET` /
    // "socket hang up"), so the elapsed time is the only reliable signal.
    const budgetMs = this.timeoutMs ?? 0;
    const startedAt = this.requestStartedAt.get(req) ?? Date.now();
    const exhaustedBudget = budgetMs > 0 && Date.now() - startedAt >= budgetMs;
    const timedOut =
      exhaustedBudget ||
      (error as NodeJS.ErrnoException).code === TIMEOUT_ERROR_CODE ||
      error.message.toLowerCase().includes('timeout');
    const status = timedOut
      ? HTTP_STATUS_GATEWAY_TIMEOUT
      : HTTP_STATUS_BAD_GATEWAY;
    const message = timedOut
      ? 'Upstream service timed out'
      : 'Upstream service unavailable';

    this.logger.error(
      `${message} (trace ${traceId}, target ${this.resolveTarget(req)}): ${error.message}`,
    );

    if (!this.isWritable(res) || res.headersSent) {
      res.destroy();
      return;
    }

    res.writeHead(status, {
      [httpHeaders.contentType]: 'application/json',
      [httpHeaders.traceId]: traceId,
    });
    res.end(
      JSON.stringify({
        status,
        isSuccess: false,
        message,
        code: '',
        data: null,
      }),
    );
  }

  private isWritable(res: Response | Socket): res is Response {
    return typeof (res as Response).writeHead === 'function';
  }

  private resolveTarget(req: Request): string {
    return (
      this.microServiceRegistry.findByGatewayPrefix(
        this.extractServicePrefix(req),
      )?.options?.host ?? ''
    );
  }

  private resolveMicroService(req: Request): MicroServiceConfig {
    const microService = this.microServiceRegistry.findByGatewayPrefix(
      this.extractServicePrefix(req),
    );
    if (!microService) {
      throw new NotFoundException('Service not found');
    }
    return microService;
  }

  private extractServicePrefix(req: Request): string {
    const segments = req.path
      .split('/')
      .filter(Boolean)
      .slice(0, SERVICE_PREFIX_SEGMENTS);
    return `/${segments.join('/')}`;
  }

  private assertSafePath(req: Request, microService: MicroServiceConfig): void {
    const rawPath = req.path;
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(rawPath);
    } catch {
      throw new NotFoundException('Invalid request path');
    }
    if (decodedPath.split('/').includes('..')) {
      throw new NotFoundException('Invalid request path');
    }

    const rewrittenPath = rawPath.replace(
      microService.options?.gatewayPrefix ?? '',
      microService.options?.pathRewrite ?? '',
    );
    if (rewrittenPath.startsWith('/internal')) {
      throw new NotFoundException('Invalid request path');
    }
  }

  private stripInboundGatewayHeaders(req: Request): void {
    Object.keys(req.headers).forEach((headerName) => {
      if (
        headerName.startsWith('x-auth-') ||
        headerName.startsWith('x-gateway-')
      ) {
        delete req.headers[headerName];
      }
    });
  }

  private ensureTraceId(req: Request): string {
    const existing = readHeader(req.headers, httpHeaders.traceId);
    if (existing) {
      return existing;
    }
    const generated = crypto.randomUUID();
    req.headers[httpHeaders.traceId] = generated;
    return generated;
  }

  private handleProxyReq(proxyReq: ClientRequest, req: Request): void {
    const pending = this.pendingInternalJwtHeaders.get(req);
    if (pending) {
      proxyReq.setHeader(
        httpHeaders.gatewayJwt,
        pending[httpHeaders.gatewayJwt],
      );
      proxyReq.setHeader(httpHeaders.traceId, pending[httpHeaders.traceId]);
    }

    fixRequestBody(proxyReq, req);
  }

  private rewritePath(path: string, req: Request): string {
    const microService = this.microServiceRegistry.findByGatewayPrefix(
      this.extractServicePrefix(req),
    );
    const gatewayPrefix = microService?.options?.gatewayPrefix;
    const pathRewrite = microService?.options?.pathRewrite;
    if (gatewayPrefix && pathRewrite) {
      return path.replace(gatewayPrefix, pathRewrite);
    }
    return path;
  }
}
