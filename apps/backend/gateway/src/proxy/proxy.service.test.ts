import { createServer, type Server } from 'node:http';
import { connect } from 'node:net';
import type { AddressInfo } from 'node:net';

import { Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import { localeMiddleware } from '@pawhaven/backend-core/middlewares';
import { traceMiddleware } from '@pawhaven/backend-core/trace';
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
    res.end(
      JSON.stringify({
        locale: req.headers['x-locale'] ?? null,
        traceId: req.headers[httpHeaders.traceId] ?? null,
      }),
    );
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  return server;
};

// Kept unanchored so it can be composed into a larger pattern (e.g. matching a
// uuid inside a raw HTTP response head) without dragging `^`/`$` along.
const UUID_SOURCE =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const UUID_PATTERN = new RegExp(`^${UUID_SOURCE}$`);

/**
 * Issues a request with a hand-written header block, bypassing the client
 * libraries' own header validation.
 */
const rawRequest = (
  port: number,
  path: string,
  rawHeaders: string,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const socket = connect(port, '127.0.0.1', () => {
      socket.write(
        `GET ${path} HTTP/1.1\r\nHost: 127.0.0.1\r\n${rawHeaders}\r\nConnection: close\r\n\r\n`,
      );
    });

    let received = '';
    socket.setEncoding('utf8');
    socket.on('data', (chunk: string) => {
      received += chunk;
    });
    socket.on('end', () => resolve(received));
    socket.on('error', reject);
  });

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
  // Mirrors `configureApp`, which installs the trace middleware for every
  // service before routing.
  app.use(traceMiddleware);
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

describe('ProxyService: trace id is echoed and forwarded', () => {
  let upstream: Server | undefined;

  afterEach(async () => {
    await close(upstream);
    upstream = undefined;
  });

  it('puts a generated trace id on the response so the caller can quote it', async () => {
    upstream = await startCapturingUpstream();
    const gateway = buildGateway(urlOf(upstream));

    const response = await request(gateway).get(PROXY_PATH);

    expect(response.headers[httpHeaders.traceId]).toMatch(UUID_PATTERN);
  });

  it('forwards the same trace id upstream that it returns to the caller', async () => {
    upstream = await startCapturingUpstream();
    const gateway = buildGateway(urlOf(upstream));

    const response = await request(gateway).get(PROXY_PATH);

    // One id for the whole hop: what the browser sees is what the service logs.
    expect(response.body.data.traceId).toBe(
      response.headers[httpHeaders.traceId],
    );
  });

  it('adopts a caller-supplied trace id so a trace can span services', async () => {
    upstream = await startCapturingUpstream();
    const gateway = buildGateway(urlOf(upstream));

    const response = await request(gateway)
      .get(PROXY_PATH)
      .set(httpHeaders.traceId, 'caller-owned-trace');

    expect(response.headers[httpHeaders.traceId]).toBe('caller-owned-trace');
    expect(response.body.data.traceId).toBe('caller-owned-trace');
  });

  it('replaces a legal-but-untrusted trace id rather than echoing it', async () => {
    upstream = await startCapturingUpstream();
    const gateway = buildGateway(urlOf(upstream));
    const address = gateway.address() as AddressInfo;

    // A raw socket is required because supertest refuses to send a value with
    // spaces. Spaces are legal in a header value but outside the trace-id
    // charset, so this must be replaced with a generated id.
    const raw = await rawRequest(
      address.port,
      PROXY_PATH,
      `${httpHeaders.traceId}: not a safe id`,
    );

    expect(raw).not.toContain('not a safe id');
    expect(raw).toMatch(new RegExp(`${httpHeaders.traceId}: ${UUID_SOURCE}`));
  });

  it('rejects a header-smuggling attempt before it can be reflected', async () => {
    upstream = await startCapturingUpstream();
    const gateway = buildGateway(urlOf(upstream));
    const address = gateway.address() as AddressInfo;

    // The folded continuation line is refused by Node's HTTP parser, so the
    // smuggled header never reaches the application at all.
    const raw = await rawRequest(
      address.port,
      PROXY_PATH,
      [`${httpHeaders.traceId}: bad`, ' x-injected: 1'].join('\r\n'),
    );

    expect(raw).toContain('400');
    expect(raw).not.toMatch(/^x-injected:/im);
  });

  it('still returns a trace id when the upstream never responds', async () => {
    upstream = await startStallingUpstream();
    const gateway = buildGateway(urlOf(upstream));

    const response = await request(gateway).get(PROXY_PATH);

    expect(response.status).toBe(HTTP_STATUS.GATEWAY_TIMEOUT);
    expect(response.headers[httpHeaders.traceId]).toMatch(UUID_PATTERN);
  });
});
