import { resolveAppConfig } from '@pawhaven/shared/utils';

import { ConfigSchema, type ConfigType } from './config.schema';
import devYaml from './dev/env/index.yaml';
import prodYaml from './prod/env/index.yaml';
import testYaml from './test/env/index.yaml';
import uatYaml from './uat/env/index.yaml';

export const EnvVariables = {
  dev: 'dev',
  uat: 'uat',
  prod: 'prod',
  test: 'test',
} as const;

const loadYamlContent = () => {
  const environmentVariables = import.meta.env;
  const currentEnv = environmentVariables.PAWHAVEN_USER_APP_ENV;
  let yamlContent = {};
  switch (currentEnv) {
    case EnvVariables.dev:
      yamlContent = devYaml;
      break;
    case EnvVariables.uat:
      yamlContent = uatYaml;
      break;
    case EnvVariables.test:
      yamlContent = testYaml;
      break;
    case EnvVariables.prod:
      yamlContent = prodYaml;
      break;
    default:
      yamlContent = devYaml;
  }
  return yamlContent;
};
export const loadConfig = (): ConfigType => {
  const environmentVariables = import.meta.env;
  const currentEnv = environmentVariables.PAWHAVEN_USER_APP_ENV;

  if (!currentEnv || !(currentEnv in EnvVariables)) {
    throw new Error(`Invalid or missing environment mode: ${currentEnv}`);
  }
  try {
    const yamlContent = loadYamlContent();

    const interpolated = resolveAppConfig<ConfigType>(
      yamlContent as ConfigType,
      environmentVariables,
    );

    const parsed = ConfigSchema.safeParse(interpolated);

    if (!parsed.success) {
      if (currentEnv !== EnvVariables.prod) {
        console.error('❌ Invalid config:', parsed?.error);
      }
      throw new Error('Config validation failed');
    }
    return parsed.data;
  } catch (error) {
    if (currentEnv !== EnvVariables.prod) {
      console.error('Error loading config:', error);
    }
    throw new Error('Config validation failed');
  }
};
