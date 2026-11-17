import { afterEach, describe, expect, it } from 'vitest';

import {
  collectServiceConfigSources,
  resolveServiceConfig,
} from './serviceConfig.js';

const SERVICE_NAME = 'core-service';
const PORT_ENV_KEY = 'PAWHAVEN_TEST_PORT';
const PORT_ENV_VALUE = '9099';

const contextOf = (entries: Record<string, unknown>) =>
  Object.assign((key: string) => entries[key], {
    keys: () => Object.keys(entries),
  });

describe('collectServiceConfigSources', () => {
  it('maps every bundled file to its env directory name', () => {
    const sources = collectServiceConfigSources(
      contextOf({
        './dev/env/index.json': { http: { env: 'dev' } },
        './uat/env/index.json': { http: { env: 'uat' } },
      }),
    );

    expect(sources).toEqual({
      dev: { http: { env: 'dev' } },
      uat: { http: { env: 'uat' } },
    });
  });

  it('unwraps a module namespace handed back by the context', () => {
    const sources = collectServiceConfigSources(
      contextOf({
        './prod/env/index.json': { default: { http: { env: 'prod' } } },
      }),
    );

    expect(sources).toEqual({ prod: { http: { env: 'prod' } } });
  });
});

describe('resolveServiceConfig', () => {
  afterEach(() => {
    delete process.env[PORT_ENV_KEY];
  });

  it('interpolates ${VAR} placeholders from process.env', () => {
    process.env[PORT_ENV_KEY] = PORT_ENV_VALUE;

    expect(
      resolveServiceConfig({
        serviceName: SERVICE_NAME,
        runtimeEnv: 'prod',
        configSources: {
          prod: { http: { port: '${PAWHAVEN_TEST_PORT}', retryCount: 3 } },
        },
      }),
    ).toEqual({ http: { port: PORT_ENV_VALUE, retryCount: 3 } });
  });

  it('fails loudly when the env was not bundled', () => {
    expect(() =>
      resolveServiceConfig({
        serviceName: SERVICE_NAME,
        runtimeEnv: 'prod',
        configSources: { dev: { http: { env: 'dev' } } },
      }),
    ).toThrow(`Config file loading failed for "${SERVICE_NAME}" (env: prod)`);
  });

  it('fails loudly when the bundled config is not an object', () => {
    expect(() =>
      resolveServiceConfig({
        serviceName: SERVICE_NAME,
        runtimeEnv: 'uat',
        configSources: { uat: undefined },
      }),
    ).toThrow(`Config file loading failed for "${SERVICE_NAME}" (env: uat)`);
  });
});
