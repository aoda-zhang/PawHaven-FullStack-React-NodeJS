import 'dotenv/config';
import { join } from 'node:path';

import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigFactory } from '@nestjs/config';
import { getRuntimeEnv, validateConfig } from '@pawhaven/shared/utils';
import type { RuntimeEnvType } from '@pawhaven/shared';

import type { ServiceConfigSchema } from './configSchema.js';
import {
  resolveServiceConfig,
  type ServiceConfigEnv,
  type ServiceConfigSource,
} from './serviceConfig.js';

export interface ConfigsModuleOptions {
  serviceRoot: string;
  serviceName: string;
  configSources?: ServiceConfigSource;
  configSchema?: ServiceConfigSchema;
}

const describeSources = (serviceRoot: string, runtimeEnv: string): string =>
  `src/config/${runtimeEnv}/env/index.json + .env* + process.env (root: ${serviceRoot})`;

@Global()
@Module({})
export class ConfigsModule {
  /**
   * dynamic configuration
   * @param options see ConfigsModuleOptions
   */
  static forRoot(options: ConfigsModuleOptions): DynamicModule {
    const { serviceRoot, serviceName, configSources, configSchema } = options;
    const runtimeEnv = process.env.NODE_ENV as RuntimeEnvType;
    const currentEnv = getRuntimeEnv(runtimeEnv);

    const configFactory: ConfigFactory = () => {
      const appConfig =
        resolveServiceConfig<Record<string, unknown>>({
          serviceName,
          runtimeEnv: currentEnv,
          configSources,
        }) ?? {};

      if (configSchema) {
        validateConfig(
          {
            serviceName,
            runtimeEnv: currentEnv,
            sources: describeSources(serviceRoot, currentEnv),
            config: { ...process.env, ...appConfig, serviceName },
            rawConfig: configSources?.[currentEnv as ServiceConfigEnv],
          },
          configSchema,
        );
      }

      return { ...appConfig, serviceName };
    };

    const DynamicConfigModule = ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [
        join(serviceRoot, `.env.local.${currentEnv}`),
        join(serviceRoot, `.env.${currentEnv}`),
        join(serviceRoot, '.env.local'),
        join(serviceRoot, '.env'),
      ],
      load: [configFactory],
    });

    return {
      module: ConfigsModule,
      imports: [DynamicConfigModule],
      exports: [ConfigModule],
    };
  }
}
