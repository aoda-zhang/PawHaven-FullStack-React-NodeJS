import crypto from 'node:crypto';

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import type { AxiosRequestConfig } from 'axios';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { HttpClientInstance } from './httpClientInstance.js';
import { httpHeaders } from '../../constants/httpHeaders.js';
import { microServiceNames } from '../../constants/microServices.js';
import { runWithTrace } from '../../trace/traceContext.js';

const testPrivateKey = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
}).privateKey as string;

const mockAxiosRequest = vi.fn((_config: AxiosRequestConfig) =>
  of({ data: 'ok', status: 200, headers: {} }),
);
const httpService = { request: mockAxiosRequest } as unknown as HttpService;

type ConfigMap = Record<string, unknown>;

const makeConfig = (map: ConfigMap): ConfigService =>
  ({
    get: (key: string) => map[key],
    getOrThrow: (key: string) => {
      if (!(key in map)) {
        throw new Error(`missing config key "${key}"`);
      }
      return map[key];
    },
  }) as unknown as ConfigService;

const defaultHeaders = { [httpHeaders.appSource]: 'nestjs-gateway' };

const microServicesConfig = [
  {
    name: microServiceNames.DOCUMENT,
    enable: true,
    options: { host: 'localhost', port: 4000 },
  },
] as unknown as ConfigMap['microServices'];

const baseConfig = (): ConfigMap => ({
  INTERNAL_JWT_PRIVATE_KEY: testPrivateKey,
  'internalJwt.keyId': 'internal-v1',
  'internalJwt.ttlSeconds': 45,
  serviceName: microServiceNames.CORE,
  microServices: microServicesConfig,
  'http.timeout': 8000,
});

const makeInstance = (
  serviceName: string,
  config: ConfigService,
): HttpClientInstance =>
  new HttpClientInstance(
    httpService,
    config,
    serviceName,
    defaultHeaders,
    new Logger(),
  );

const decodeJwtPayload = (token: string): Record<string, unknown> =>
  JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

describe('HttpClientInstance internal auth header', () => {
  beforeEach(() => {
    mockAxiosRequest.mockClear();
  });

  it('auto-signs an internal JWT with aud=target and sub=caller for service-to-service calls', async () => {
    const instance = makeInstance(
      microServiceNames.DOCUMENT,
      makeConfig(baseConfig()),
    );

    await instance.get<string>('/pdf/render');

    expect(mockAxiosRequest).toHaveBeenCalledTimes(1);
    const requestConfig = mockAxiosRequest.mock
      .calls[0][0] as AxiosRequestConfig;
    const token = requestConfig.headers?.[httpHeaders.gatewayJwt] as
      string | undefined;
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const claims = decodeJwtPayload(token as string);
    expect(claims.aud).toBe(microServiceNames.DOCUMENT);
    expect(claims.sub).toBe(microServiceNames.CORE);
    expect(claims.kind).toBe('authenticated');
    expect(typeof claims.exp).toBe('number');
    expect((claims.exp as number) - (claims.iat as number)).toBe(45);
  });

  it('does not override a caller-provided gateway jwt header', async () => {
    const instance = makeInstance(
      microServiceNames.DOCUMENT,
      makeConfig(baseConfig()),
    );

    await instance.get<string>('/pdf/render', {
      headers: { [httpHeaders.gatewayJwt]: 'caller-signed-token' },
    });

    const requestConfig = mockAxiosRequest.mock
      .calls[0][0] as AxiosRequestConfig;
    expect(requestConfig.headers?.[httpHeaders.gatewayJwt]).toBe(
      'caller-signed-token',
    );
  });

  it('omits the internal jwt header when the private key is missing', async () => {
    const config = baseConfig();
    delete config['INTERNAL_JWT_PRIVATE_KEY'];
    const instance = makeInstance(
      microServiceNames.DOCUMENT,
      makeConfig(config),
    );

    await instance.get<string>('/pdf/render');

    const requestConfig = mockAxiosRequest.mock
      .calls[0][0] as AxiosRequestConfig;
    expect(requestConfig.headers?.[httpHeaders.gatewayJwt]).toBeUndefined();
  });
});

const lastRequestConfig = (): AxiosRequestConfig =>
  mockAxiosRequest.mock.calls.at(-1)?.[0] as AxiosRequestConfig;

const lastRequestTraceId = (): unknown =>
  lastRequestConfig().headers?.[httpHeaders.traceId];

const lastRequestRid = (): unknown => {
  const token = lastRequestConfig().headers?.[httpHeaders.gatewayJwt];
  return typeof token === 'string' ? decodeJwtPayload(token).rid : undefined;
};

describe('HttpClientInstance trace propagation', () => {
  beforeEach(() => {
    mockAxiosRequest.mockClear();
  });

  const documentInstance = () =>
    makeInstance(microServiceNames.DOCUMENT, makeConfig(baseConfig()));

  it('forwards the ambient request trace id on a service-to-service call', async () => {
    const instance = documentInstance();

    await runWithTrace('ambient-trace', () => instance.get<string>('/pdf/x'));

    expect(lastRequestTraceId()).toBe('ambient-trace');
  });

  it('sets the internal jwt rid to the same trace id as the header', async () => {
    const instance = documentInstance();

    await runWithTrace('shared-trace', () => instance.get<string>('/pdf/x'));

    expect(lastRequestRid()).toBe('shared-trace');
    expect(lastRequestRid()).toBe(lastRequestTraceId());
  });

  it('keeps the same trace id across a chained hop', async () => {
    const instance = documentInstance();

    await runWithTrace('chain-trace', async () => {
      await instance.get<string>('/pdf/first');
      await instance.get<string>('/pdf/second');
    });

    expect(lastRequestTraceId()).toBe('chain-trace');
    expect(lastRequestRid()).toBe('chain-trace');
  });

  it('mints a fresh id outside a request scope instead of sending none', async () => {
    const instance = documentInstance();

    await instance.get<string>('/pdf/cron');

    expect(lastRequestTraceId()).toEqual(expect.any(String));
    expect(lastRequestTraceId()).not.toBe('');
  });

  it('honours an explicit traceId override', async () => {
    const instance = documentInstance();

    await runWithTrace('ambient-trace', () =>
      instance.get<string>('/pdf/x', { traceId: 'explicit-trace' }),
    );

    expect(lastRequestTraceId()).toBe('explicit-trace');
    expect(lastRequestRid()).toBe('explicit-trace');
  });

  it('does not let a raw header override the resolved trace id', async () => {
    const instance = documentInstance();

    await runWithTrace('ambient-trace', () =>
      instance.get<string>('/pdf/x', {
        headers: { [httpHeaders.traceId]: 'sneaky-override' },
      }),
    );

    // A raw header would desync the header from the `rid` claim the callee
    // cross-checks, so `context.traceId` stays authoritative.
    expect(lastRequestTraceId()).toBe('ambient-trace');
    expect(lastRequestRid()).toBe('ambient-trace');
  });

  it('keeps concurrent calls on their own trace', async () => {
    const instance = documentInstance();

    await Promise.all([
      runWithTrace('trace-a', () => instance.get<string>('/pdf/a')),
      runWithTrace('trace-b', () => instance.get<string>('/pdf/b')),
    ]);

    const traceIds = mockAxiosRequest.mock.calls.map(
      (call) => (call[0] as AxiosRequestConfig).headers?.[httpHeaders.traceId],
    );
    expect(traceIds).toEqual(expect.arrayContaining(['trace-a', 'trace-b']));
  });

  it('propagates on every verb, not just GET', async () => {
    const instance = documentInstance();

    await runWithTrace('verb-trace', async () => {
      await instance.post<string>('/pdf/x', { a: 1 });
      await instance.put<string>('/pdf/x', { a: 1 });
      await instance.delete<string>('/pdf/x');
    });

    const traceIds = mockAxiosRequest.mock.calls.map(
      (call) => (call[0] as AxiosRequestConfig).headers?.[httpHeaders.traceId],
    );
    expect(traceIds).toEqual(['verb-trace', 'verb-trace', 'verb-trace']);
  });
});
