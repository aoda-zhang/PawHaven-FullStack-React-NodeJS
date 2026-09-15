import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProxyService } from './proxy.service.js';

const TIMEOUT_MS = 300;
const HTTP_STATUS_BAD_GATEWAY = 502;
const HTTP_STATUS_GATEWAY_TIMEOUT = 504;
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

const buildGateway = (target: string) => {
  const configService = { get: vi.fn(() => TIMEOUT_MS) };
  const identityResolver = {
    resolve: vi.fn(async () => ({ kind: 'anonymous' })),
  };
  const internalJwtService = {
    sign: vi.fn(() => ({ [httpHeaders.gatewayJwt]: 'signed' })),
  };
  const internalJwtTargetResolver = { resolve: vi.fn(() => 'core-v1') };
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

    expect(response.status).toBe(HTTP_STATUS_GATEWAY_TIMEOUT);
    expect(response.body).toEqual({
      status: HTTP_STATUS_GATEWAY_TIMEOUT,
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

    expect(response.status).toBe(HTTP_STATUS_BAD_GATEWAY);
    expect(response.body).toEqual({
      status: HTTP_STATUS_BAD_GATEWAY,
      isSuccess: false,
      message: 'Upstream service unavailable',
      code: '',
      data: null,
    });
  });
});
