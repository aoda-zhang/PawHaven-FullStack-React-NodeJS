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
