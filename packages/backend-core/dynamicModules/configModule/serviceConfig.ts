import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as yaml from 'js-yaml';
import { resolveAppConfig } from '@pawhaven/shared/utils';

type ServiceConfigLookup = {
  serviceName: string;
  configRoot: string;
  runtimeEnv: string;
};

export const serviceConfigPath = (
  configRoot: string,
  runtimeEnv: string,
): string => join(configRoot, runtimeEnv, 'env/index.yaml');

export const resolveServiceConfig = <T = unknown>({
  serviceName,
  configRoot,
  runtimeEnv,
}: ServiceConfigLookup): T => {
  const configPath = serviceConfigPath(configRoot, runtimeEnv);

  try {
    return resolveAppConfig(
      yaml.load(readFileSync(configPath, 'utf8')) as T,
      process.env,
    );
  } catch (error) {
    throw new Error(
      `Config file loading failed for "${serviceName}" (${configPath}): ${error}`,
    );
  }
};
