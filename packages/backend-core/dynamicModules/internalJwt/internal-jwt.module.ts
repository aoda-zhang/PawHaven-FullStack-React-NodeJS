import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as yaml from 'js-yaml';
import { getRuntimeEnv, resolveAppConfig } from '@pawhaven/shared/utils';
import type { RuntimeEnvType } from '@pawhaven/shared';

import { InternalJwtGuard } from './internal-jwt.guard.js';

type InternalJwtConfigFile = {
  internalJwt?: { enabled?: boolean };
};

@Module({})
export class InternalJwtModule {
  static forRoot(serviceName: string, serviceRoot: string): DynamicModule {
    if (!this.isEnabled(serviceName, serviceRoot)) {
      return { module: InternalJwtModule };
    }

    return {
      module: InternalJwtModule,
      providers: [
        InternalJwtGuard,
        { provide: APP_GUARD, useExisting: InternalJwtGuard },
      ],
      exports: [InternalJwtGuard],
    };
  }

  private static isEnabled(serviceName: string, serviceRoot: string): boolean {
    const currentEnv = getRuntimeEnv(process.env.NODE_ENV as RuntimeEnvType);

    let parsedConfig: unknown;
    try {
      const configPath = join(
        serviceRoot,
        `src/config/${currentEnv}/env/index.yaml`,
      );
      parsedConfig = yaml.load(readFileSync(configPath, 'utf8'));
      parsedConfig = resolveAppConfig(
        parsedConfig as InternalJwtConfigFile,
        process.env,
      );
    } catch (error) {
      const cause = error instanceof Error ? error.message : String(error);
      throw new Error(
        `[InternalJwtModule] Cannot resolve internalJwt.enabled for service "${serviceName}" (env: ${currentEnv}): ${cause}`,
      );
    }

    const enabled = (parsedConfig as InternalJwtConfigFile | undefined)
      ?.internalJwt?.enabled;

    if (enabled === undefined) {
      throw new Error(
        `[InternalJwtModule] Service "${serviceName}" does not declare internalJwt.enabled (env: ${currentEnv}); SharedModule consumers must set it explicitly (gateway: enabled: false, downstream: enabled: true). Refusing to boot "${serviceName}" without the InternalJwtGuard.`,
      );
    }

    return enabled === true;
  }
}
