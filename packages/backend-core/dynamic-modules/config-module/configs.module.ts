import 'dotenv/config';
import { join } from 'node:path';

import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigFactory } from '@nestjs/config';
import { getRuntimeEnv } from '@pawhaven/shared/utils';
import type { RuntimeEnvType } from '@pawhaven/shared';

import {
  resolveServiceConfig,
  type ServiceConfigSource,
} from './serviceConfig.js';

@Global()
@Module({})
export class ConfigsModule {
  /**
   * dynamic configuration
   * @param serviceRoot absolute path to service root directory
   */
  static forRoot(
    serviceRoot: string,
    serviceName: string,
    configSources?: ServiceConfigSource,
  ): DynamicModule {
    const runtimeEnv = process.env.NODE_ENV as RuntimeEnvType;
    const currentEnv = getRuntimeEnv(runtimeEnv);

    const appConfig =
      resolveServiceConfig<Record<string, unknown>>({
        serviceName,
        runtimeEnv: currentEnv,
        configSources,
      }) ?? {};
    const configFactory: ConfigFactory = () => ({
      ...appConfig,
      serviceName,
    });

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
