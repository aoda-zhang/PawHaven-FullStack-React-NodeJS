import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigFactory } from '@nestjs/config';
import * as yaml from 'js-yaml';
import { getRuntimeEnv, resolveAppConfig } from '@pawhaven/shared/utils';
import type { RuntimeEnvType } from '@pawhaven/shared';

@Global()
@Module({})
export class ConfigsModule {
  /**
   * dynamic configuration
   * @param serviceRoot absolute path to service root directory
   */
  static forRoot(serviceRoot: string, serviceName: string): DynamicModule {
    const runtimeEnv = process.env.NODE_ENV as RuntimeEnvType;
    const currentEnv = getRuntimeEnv(runtimeEnv);

    const yamlContent = this.loadYamlContent<Record<string, unknown>>(
      currentEnv,
      serviceName,
    );
    const appConfig = resolveAppConfig(yamlContent, process.env) ?? {};
    const configFactory: ConfigFactory = () => ({
      ...appConfig,
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

  private static loadYamlContent<T = unknown>(
    runtimeEnv: string,
    serviceName: string,
  ): T {
    const PROJECT_ROOT = join(__dirname, '../../../../../');
    const conventionalConfigPath = join(
      PROJECT_ROOT,
      `apps/backend/${serviceName}/src/config/${runtimeEnv}/env/index.yaml`,
    );
    try {
      return yaml.load(readFileSync(conventionalConfigPath, 'utf8')) as T;
    } catch (error) {
      throw new Error(`Config file loading failed: ${error}`);
    }
  }
}
