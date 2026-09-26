import { resolveAppConfig, validateConfig } from '@pawhaven/shared/utils';

import { ConfigSchema, type ConfigType } from './config.schema';
import devConfig from './dev/env/index.json';
import uatConfig from './uat/env/index.json';
import testConfig from './test/env/index.json';
import prodConfig from './prod/env/index.json';

export const EnvVariables = {
  dev: 'dev',
  uat: 'uat',
  prod: 'prod',
  test: 'test',
} as const;

const loadEnvContent = () => {
  const environmentVariables = import.meta.env;
  const currentEnv = environmentVariables.PAWHAVEN_USER_APP_ENV;
  switch (currentEnv) {
    case EnvVariables.dev:
      return devConfig;
    case EnvVariables.uat:
      return uatConfig;
    case EnvVariables.test:
      return testConfig;
    case EnvVariables.prod:
      return prodConfig;
    default:
      return devConfig;
  }
};

export const loadConfig = (): ConfigType => {
  const environmentVariables = import.meta.env;
  const currentEnv = environmentVariables.PAWHAVEN_USER_APP_ENV;

  if (!currentEnv || !(currentEnv in EnvVariables)) {
    throw new Error(`Invalid or missing environment mode: ${currentEnv}`);
  }
  try {
    const envContent = loadEnvContent();

    const interpolated = resolveAppConfig<ConfigType>(
      envContent as ConfigType,
      environmentVariables,
    );

    validateConfig(
      {
        serviceName: 'portal',
        runtimeEnv: currentEnv,
        sources: `json(${currentEnv}) + import.meta.env`,
        config: interpolated as Record<string, unknown>,
      },
      ConfigSchema,
    );

    return interpolated as ConfigType;
  } catch (error) {
    if (currentEnv !== EnvVariables.prod) {
      console.error('Error loading config:', error);
    }
    throw error;
  }
};
