import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import { localeMiddleware } from '@pawhaven/backend-core/middlewares';
import { HTTP_STATUS } from '@pawhaven/shared/constants';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProxyService } from './proxy.service.js';

const TIMEOUT_MS = 300;
const PROXY_PATH = '/api/core/home';
const CLOSED_PORT = 1;
const MICRO_SERVICE = 'core-service';

const startStallingUpstream = async (): Promise<Server> => {
  const server = createServer(() => {
    // Never responds, so the proxy has to give up on its own.
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  return server;
};

const urlOf = (server: Server): string => {
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
};

const close = (server: Server | undefined): Promise<void> =>
  new Promise<void>((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    server.close(() => {
      resolve();
    });
  });

const startCapturingUpstream = async (): Promise<Server> => {
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ locale: req.headers['x-locale'] ?? null }));
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  return server;
};

const buildGateway = (target: string) => {
  const configService = { get: vi.fn(() => TIMEOUT_MS) };
  const identityResolver = {
    resolve: vi.fn(async () => ({ kind: 'anonymous' })),
  };
  const internalJwtService = {
    sign: vi.fn(() => ({ [httpHeaders.gatewayJwt]: 'signed' })),
  };
  const internalJwtTargetResolver = { resolve: vi.fn(() => 'internal-v1') };
  const microServiceRegistry = {
    findByGatewayPrefix: vi.fn(() => ({
      name: MICRO_SERVICE,
      options: {
        host: target,
        gatewayPrefix: '/api/core',
        pathRewrite: '/core-service',
      },
    })),
  };

  const proxy = new ProxyService(
    configService as never,
    identityResolver as never,
    internalJwtService as never,
    internalJwtTargetResolver as never,
    microServiceRegistry as never,
  );

  const app = new ExpressAdapter().getInstance();
  app.use(localeMiddleware);
  app.use((req: never, res: never, next: never) => {
    proxy.proxyRequest(req, res, next).catch(() => undefined);
  });

  return app.listen(0);
};

describe('ProxyService: upstream failures reach the caller', () => {
  let upstream: Server | undefined;
  let loggedError: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    loggedError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await close(upstream);
    upstream = undefined;
    loggedError?.mockRestore();
  });

  it('answers 504 with the error envelope when the upstream stalls', async () => {
    upstream = await startStallingUpstream();
    const gateway = buildGateway(urlOf(upstream));

    const response = await request(gateway).get(PROXY_PATH);

    expect(response.status).toBe(HTTP_STATUS.GATEWAY_TIMEOUT);
    expect(response.body).toEqual({
      status: HTTP_STATUS.GATEWAY_TIMEOUT,
      isSuccess: false,
      message: 'Upstream service timed out',
      code: '',
      data: null,
    });
    expect(loggedError).toHaveBeenCalled();
  });

  it('answers 502 with the error envelope when the upstream refuses the connection', async () => {
    const gateway = buildGateway(`http://127.0.0.1:${CLOSED_PORT}`);

    const response = await request(gateway).get(PROXY_PATH);

    expect(response.status).toBe(HTTP_STATUS.BAD_GATEWAY);
    expect(response.body).toEqual({
      status: HTTP_STATUS.BAD_GATEWAY,
      isSuccess: false,
      message: 'Upstream service unavailable',
      code: '',
      data: null,
    });
  });
});

describe('ProxyService: locale is normalized onto the proxied request', () => {
  let upstream: Server | undefined;

  afterEach(async () => {
    await close(upstream);
    upstream = undefined;
  });

  it('forwards a canonical x-locale unchanged', async () => {
    upstream = await startCapturingUpstream();
    const gateway = buildGateway(urlOf(upstream));

    const response = await request(gateway)
      .get(PROXY_PATH)
      .set('x-locale', 'zh-CN');

    expect(response.status).toBe(200);
    expect(response.body.data.locale).toBe('zh-CN');
  });

  it('falls back to en-US for a non-canonical x-locale', async () => {
    upstream = await startCapturingUpstream();
    const gateway = buildGateway(urlOf(upstream));

    const response = await request(gateway)
      .get(PROXY_PATH)
      .set('x-locale', 'fr-FR');

    expect(response.status).toBe(200);
    expect(response.body.data.locale).toBe('en-US');
  });

  it('defaults to en-US when x-locale is absent', async () => {
    upstream = await startCapturingUpstream();
    const gateway = buildGateway(urlOf(upstream));

    const response = await request(gateway).get(PROXY_PATH);

    expect(response.status).toBe(200);
    expect(response.body.data.locale).toBe('en-US');
  });

  it('ignores the bare locale header and resolves accept-language', async () => {
    upstream = await startCapturingUpstream();
    const gateway = buildGateway(urlOf(upstream));

    const viaLocaleHeader = await request(gateway)
      .get(PROXY_PATH)
      .set('locale', 'de-DE');
    const viaAcceptLanguage = await request(gateway)
      .get(PROXY_PATH)
      .set(httpHeaders.acceptLanguage, 'zh-CN,zh;q=0.9');

    expect(viaLocaleHeader.body.data.locale).toBe('en-US');
    expect(viaAcceptLanguage.body.data.locale).toBe('zh-CN');
  });
});
