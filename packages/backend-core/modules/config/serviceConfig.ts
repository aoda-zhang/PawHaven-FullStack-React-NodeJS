import { resolveAppConfig } from '@pawhaven/shared/utils';

export type ServiceConfigEnv = 'dev' | 'test' | 'uat' | 'prod';

export type ServiceConfig = Record<string, unknown>;

export type ServiceConfigSource = Partial<
  Record<ServiceConfigEnv, ServiceConfig>
>;

export type ServiceConfigContext = {
  keys(): string[];
  (id: string): unknown;
};

type ServiceConfigLookup = {
  serviceName: string;
  runtimeEnv: string;
  configSources?: ServiceConfigSource;
};

const toServiceConfig = (entry: unknown): ServiceConfig =>
  (typeof entry === 'object' && entry !== null && 'default' in entry
    ? (entry as { default: ServiceConfig }).default
    : entry) as ServiceConfig;

export const collectServiceConfigSources = (
  context: ServiceConfigContext,
): ServiceConfigSource => {
  const sources: ServiceConfigSource = {};

  context.keys().forEach((key) => {
    sources[key.split('/')[1] as ServiceConfigEnv] = toServiceConfig(
      context(key),
    );
  });

  return sources;
};

export const resolveServiceConfig = <T = unknown>({
  serviceName,
  runtimeEnv,
  configSources,
}: ServiceConfigLookup): T => {
  const config = configSources?.[runtimeEnv as ServiceConfigEnv];

  try {
    if (typeof config !== 'object' || config === null) {
      throw new Error(
        `no configuration was bundled for env "${runtimeEnv}"; a service must pass every env it supports via SharedModule.forRoot({ configSources })`,
      );
    }

    return resolveAppConfig(config as T, process.env);
  } catch (error) {
    throw new Error(
      `Config file loading failed for "${serviceName}" (env: ${runtimeEnv}): ${error}`,
    );
  }
};
